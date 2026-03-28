import { PanoViewer } from '@egjs/react-view360'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isScreenHotspot, type PanoHotspot } from '../data/hotspots'
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
): LayoutItem {
  const key = `${sceneId}-${i}-${hotspot.to}`
  const base = {
    key,
    to: hotspot.to,
    label: hotspot.label,
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

    const next = hotspots.map((hotspot, i) =>
      layoutForHotspot(hotspot, i, sceneId, cw, ch, yaw, pitch, fov),
    )
    setLayouts(next)
  }, [containerRef, panoRef, hotspots, sceneId])

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
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden={!anyVisible}
    >
      {layouts.map((item) =>
        item.visible ? (
          <Link
            key={item.key}
            to={`/tour/${item.to}`}
            className="pointer-events-auto absolute rounded-md border border-cyan-400/60 bg-cyan-500/15 outline-none ring-offset-2 ring-offset-zinc-950 transition hover:bg-cyan-500/25 focus-visible:ring-2 focus-visible:ring-cyan-300"
            style={{
              left: item.left,
              top: item.top,
              width: item.width,
              height: item.height,
            }}
            title={item.label}
            aria-label={item.label ?? `Перейти к панораме ${item.to}`}
          />
        ) : null,
      )}
    </div>
  )
}
