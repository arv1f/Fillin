import { useEffect, useState } from 'react'

export type HotspotFontSize = 'sm' | 'md' | 'lg'

const STORAGE_KEY = 'fillin-hotspot-font'

function readStored(): HotspotFontSize {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'sm' || v === 'md' || v === 'lg') return v
  } catch {
    /* ignore */
  }
  return 'md'
}

/** Синхронизирует `data-hotspot-font` на `<html>` и localStorage. */
export function useHotspotFontPreference(): readonly [
  HotspotFontSize,
  (size: HotspotFontSize) => void,
] {
  const [size, setSize] = useState<HotspotFontSize>(() => readStored())

  useEffect(() => {
    document.documentElement.dataset.hotspotFont = size
    try {
      localStorage.setItem(STORAGE_KEY, size)
    } catch {
      /* ignore */
    }
  }, [size])

  return [size, setSize] as const
}
