import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useUiString,
  useZoneMapRange,
  useZoneTitle,
} from '../contexts/SceneContentContext'
import {
  entrySceneForZone,
  sceneZoneKind,
  ZONE_MAP_ORDER,
} from '../data/sceneLabels'
import { DEFAULT_UI_STRINGS } from '../data/sceneCopyDefaults'
import type { SceneZoneKind } from '../sceneZoneTypes'
import type { SceneId } from '../scenes'

type ZoneKind = (typeof ZONE_MAP_ORDER)[number]['kind']

type Props = {
  currentSceneId: SceneId
}

function zoneClass(active: boolean): string {
  const base =
    'flex min-h-[3.25rem] flex-col items-center justify-center rounded-md border px-1.5 py-2 text-center transition'
  if (active) {
    return `${base} border-cyan-400/80 bg-cyan-500/15 text-cyan-50 ring-1 ring-cyan-400/50`
  }
  return `${base} border-zinc-600 bg-zinc-900/80 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800`
}

export function RoomZoneMap({ currentSceneId }: Props) {
  const [open, setOpen] = useState(false)
  const active = sceneZoneKind(currentSceneId)

  const mapBtn = useUiString(
    'room_zone_map_button',
    DEFAULT_UI_STRINGS.room_zone_map_button ?? 'Карта зон',
  )
  const mapHint = useUiString(
    'room_zone_map_hint',
    DEFAULT_UI_STRINGS.room_zone_map_hint ?? '',
  )
  const mapOpenTitle = useUiString(
    'room_zone_map_open_title',
    DEFAULT_UI_STRINGS.room_zone_map_open_title ?? '',
  )
  const mapRegionAria = useUiString(
    'room_zone_map_region_aria',
    DEFAULT_UI_STRINGS.room_zone_map_region_aria ?? '',
  )

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col items-end gap-1 sm:right-5 sm:top-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto rounded-md border border-zinc-600 bg-zinc-950/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900"
        aria-expanded={open}
        aria-controls="room-zone-map-panel"
        title={mapOpenTitle}
      >
        {mapBtn}
      </button>

      {open ? (
        <div
          id="room-zone-map-panel"
          role="region"
          aria-label={mapRegionAria}
          className="pointer-events-auto w-[min(17rem,90vw)] rounded-lg border border-zinc-700/90 bg-zinc-950/95 p-2.5 shadow-xl backdrop-blur-md"
        >
          <p className="mb-2 border-b border-zinc-800 pb-2 text-[10px] leading-snug text-zinc-500">
            {mapHint}
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            <ZoneMapCell kind="corridor" active={active} />
            <ZoneMapCell kind="second" active={active} />
            <ZoneMapCell kind="interactive" active={active} />
            <ZoneMapCell kind="historical" active={active} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ZoneMapCell({
  kind,
  active,
}: {
  kind: ZoneKind
  active: SceneZoneKind
}) {
  const title = useZoneTitle(kind)
  const range = useZoneMapRange(kind)
  const isHere = active === kind
  const entry = entrySceneForZone(kind)
  if (!entry) return null

  return (
    <Link
      to={`/tour/${entry}`}
      className={`${zoneClass(isHere)} ${kind === 'corridor' ? 'col-span-3' : ''}`}
      title={`${title} (${range}) — точка ${entry}`}
    >
      <span className="scale-90 text-[11px] font-semibold leading-tight sm:text-xs">
        {title}
      </span>
    </Link>
  )
}
