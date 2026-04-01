import { PanoViewer } from '@egjs/react-view360'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isScreenHotspot, type PanoHotspot } from '../data/hotspots'
import { separateOverlappingRects } from '../lib/hotspotOverlap'
import {
  normRectFromCorners,
  normRectToPixels,
  projectYawPitchRect,
} from '../lib/panoProject'
import type { SceneId } from '../scenes'

type PanoViewerInstance = InstanceType<typeof PanoViewer>

type LayoutItem = {
  key: string
  to: SceneId
  label?: string
  left: number
  top: number
  width: number
  height: number
  visible: boolean
}

type Props = {
  sceneId: SceneId
  hotspots: PanoHotspot[]
  /** Подписи точек назначения (из БД / API). */
  sceneTitles: Record<string, string>
  panoRef: React.RefObject<PanoViewerInstance | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  viewTick: number
}

function layoutForHotspot(
  hotspot: PanoHotspot,
  i: number,
  sceneId: SceneId,
  cw: number,
  ch: number,
  yaw: number,
  pitch: number,
  fov: number,
  getTitle: (id: SceneId) => string,
): LayoutItem {
  const key = `${sceneId}-${i}-${hotspot.to}`
  const custom = hotspot.customLabel?.trim()
  const label = custom || getTitle(hotspot.to)
  const base = {
    key,
    to: hotspot.to,
    label,
  }

  if (isScreenHotspot(hotspot)) {
    const norm = normRectFromCorners(hotspot.corners)
    const rect = normRectToPixels(norm, cw, ch)
    return { ...base, ...rect }
  }

  const rect = projectYawPitchRect(
    cw,
    ch,
    yaw,
    pitch,
    fov,
    hotspot.yaw,
    hotspot.pitch,
    hotspot.yawHalfSpan,
    hotspot.pitchHalfSpan,
    {
      maxWidthPx: hotspot.maxWidthPx,
      maxHeightPx: hotspot.maxHeightPx,
    },
  )
  return { ...base, ...rect }
}

export function PanoHotspotsOverlay({
  sceneId,
  hotspots,
  sceneTitles,
  panoRef,
  containerRef,
  viewTick,
}: Props) {
  const [layouts, setLayouts] = useState<LayoutItem[]>([])

  const recompute = useCallback(() => {
    const box = containerRef.current
    if (!box || hotspots.length === 0) {
      setLayouts([])
      return
    }

    const cw = box.clientWidth
    const ch = box.clientHeight
    if (cw < 2 || ch < 2) {
      setLayouts([])
      return
    }

    const needsSphere = hotspots.some((h) => !isScreenHotspot(h))
    let yaw = 0
    let pitch = 0
    let fov = 65

    if (needsSphere) {
      const pano = panoRef.current
      if (!pano) {
        setLayouts([])
        return
      }
      try {
        yaw = pano.getYaw()
        pitch = pano.getPitch()
        fov = pano.getFov()
      } catch {
        setLayouts([])
        return
      }
    }

    const getTitle = (id: SceneId) =>
      sceneTitles[id] ?? `Точка ${id}`

    const next = hotspots.map((hotspot, i) =>
      layoutForHotspot(
        hotspot,
        i,
        sceneId,
        cw,
        ch,
        yaw,
        pitch,
        fov,
        getTitle,
      ),
    )
    const visibleRects = next.filter(
      (x) => x.visible && x.width > 4 && x.height > 4,
    )
    if (visibleRects.length >= 2) {
      separateOverlappingRects(visibleRects, cw)
    }
    setLayouts(next)
  }, [containerRef, panoRef, hotspots, sceneId, sceneTitles])

  useLayoutEffect(() => {
    recompute()
  }, [recompute, sceneId, viewTick])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => recompute())
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, recompute])

  if (hotspots.length === 0) return null

  const anyVisible = layouts.some((l) => l.visible)

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden={!anyVisible}
    >
      {layouts.map((item) =>
        item.visible ? (
          <Link
            key={item.key}
            to={`/tour/${item.to}`}
            className="pointer-events-auto absolute flex items-center justify-center overflow-hidden rounded-md border border-cyan-400/60 bg-cyan-500/15 px-1 py-0.5 text-center outline-none ring-offset-2 ring-offset-zinc-950 transition hover:bg-cyan-500/25 focus-visible:ring-2 focus-visible:ring-cyan-300"
            style={{
              left: item.left,
              top: item.top,
              width: item.width,
              height: item.height,
            }}
            title={item.label}
            aria-label={`${item.label} — панорама ${item.to}`}
          >
            <span
              className="line-clamp-4 max-h-full w-full break-words font-medium leading-tight text-cyan-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
              style={{ fontSize: 'var(--hotspot-font-size)' }}
            >
              {item.label}
            </span>
          </Link>
        ) : null,
      )}
    </div>
  )
}
