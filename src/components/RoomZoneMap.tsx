import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  entrySceneForZone,
  sceneZoneKind,
  ZONE_LABELS,
  ZONE_MAP_RANGES,
} from '../data/sceneLabels'
import type { SceneId } from '../scenes'

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

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col items-end gap-1 sm:right-5 sm:top-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto rounded-md border border-zinc-600 bg-zinc-950/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900"
        aria-expanded={open}
        aria-controls="room-zone-map-panel"
        title="Схема зон музея"
      >
        Карта зон
      </button>

      {open ? (
        <div
          id="room-zone-map-panel"
          role="region"
          aria-label="Схематичная карта зон по номерам точек"
          className="pointer-events-auto w-[min(17rem,90vw)] rounded-lg border border-zinc-700/90 bg-zinc-950/95 p-2.5 shadow-xl backdrop-blur-md"
        >
          <p className="mb-2 border-b border-zinc-800 pb-2 text-[10px] leading-snug text-zinc-500">
            Схема по зонам. Точки — ориентир по маршруту.
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            {ZONE_MAP_RANGES.map((z) => {
              const isHere = active === z.kind
              const entry = entrySceneForZone(z.kind)
              if (!entry) return null
              return (
                <Link
                  key={z.kind}
                  to={`/tour/${entry}`}
                  className={`${zoneClass(isHere)} ${z.kind === 'corridor' ? 'col-span-3' : ''}`}
                  title={`${ZONE_LABELS[z.kind]} (${z.range}) — точка ${entry}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-[11px] font-semibold leading-tight sm:text-xs scale-90">
                    {ZONE_LABELS[z.kind]}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
