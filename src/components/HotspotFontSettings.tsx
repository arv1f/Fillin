import { useState } from 'react'
import { useUiString } from '../contexts/SceneContentContext'
import { DEFAULT_UI_STRINGS } from '../data/sceneCopyDefaults'
import type { HotspotFontSize } from '../hooks/useHotspotFontPreference'

type Props = {
  size: HotspotFontSize
  onChange: (size: HotspotFontSize) => void
}

const SIZE_KEYS: { id: HotspotFontSize; uiKey: string; fallback: string }[] = [
  { id: 'sm', uiKey: 'hotspot_font_sm', fallback: 'Мелкий' },
  { id: 'md', uiKey: 'hotspot_font_md', fallback: 'Средний' },
  { id: 'lg', uiKey: 'hotspot_font_lg', fallback: 'Крупный' },
]

export function HotspotFontSettings({ size, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const toggleLabel = useUiString(
    'hotspot_font_toggle',
    DEFAULT_UI_STRINGS.hotspot_font_toggle ?? 'Текст Aa',
  )
  const panelTitle = useUiString(
    'hotspot_font_panel_title',
    DEFAULT_UI_STRINGS.hotspot_font_panel_title ?? '',
  )
  const groupAria = useUiString(
    'hotspot_font_group_aria',
    DEFAULT_UI_STRINGS.hotspot_font_group_aria ?? '',
  )
  const heading = useUiString(
    'hotspot_font_heading',
    DEFAULT_UI_STRINGS.hotspot_font_heading ?? '',
  )

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 sm:bottom-5 sm:left-5">
      <div className="pointer-events-auto flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-zinc-600 bg-zinc-950/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900"
          aria-expanded={open}
          aria-controls="hotspot-font-panel"
          title={panelTitle}
        >
          {toggleLabel}
        </button>
        {open ? (
          <div
            id="hotspot-font-panel"
            role="group"
            aria-label={groupAria}
            className="rounded-lg border border-zinc-700 bg-zinc-950/95 p-2 shadow-xl backdrop-blur-md"
          >
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {heading}
            </p>
            <div className="flex flex-col gap-1">
              {SIZE_KEYS.map((o) => (
                <HotspotFontSizeButton
                  key={o.id}
                  option={o}
                  active={size === o.id}
                  onPick={() => {
                    onChange(o.id)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function HotspotFontSizeButton({
  option,
  active,
  onPick,
}: {
  option: (typeof SIZE_KEYS)[number]
  active: boolean
  onPick: () => void
}) {
  const label = useUiString(option.uiKey, option.fallback)
  return (
    <button
      type="button"
      onClick={onPick}
      className={`rounded px-2 py-1 text-left text-xs transition ${
        active
          ? 'bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-500/50'
          : 'text-zinc-300 hover:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  )
}
