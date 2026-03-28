import { useState } from 'react'
import type { HotspotFontSize } from '../hooks/useHotspotFontPreference'

type Props = {
  size: HotspotFontSize
  onChange: (size: HotspotFontSize) => void
}

const OPTIONS: { id: HotspotFontSize; label: string }[] = [
  { id: 'sm', label: 'Мелкий' },
  { id: 'md', label: 'Средний' },
  { id: 'lg', label: 'Крупный' },
]

export function HotspotFontSettings({ size, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 sm:bottom-5 sm:left-5">
      <div className="pointer-events-auto flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-zinc-600 bg-zinc-950/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900"
          aria-expanded={open}
          aria-controls="hotspot-font-panel"
          title="Размер текста на кнопках переходов"
        >
          Текст Aa
        </button>
        {open ? (
          <div
            id="hotspot-font-panel"
            role="group"
            aria-label="Размер шрифта на хотспотах"
            className="rounded-lg border border-zinc-700 bg-zinc-950/95 p-2 shadow-xl backdrop-blur-md"
          >
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Подписи на кнопках
            </p>
            <div className="flex flex-col gap-1">
              {OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id)
                    setOpen(false)
                  }}
                  className={`rounded px-2 py-1 text-left text-xs transition ${
                    size === o.id
                      ? 'bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-500/50'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
