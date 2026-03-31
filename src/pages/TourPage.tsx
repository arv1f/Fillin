import { PanoViewer } from '@egjs/react-view360'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { HotspotFontSettings } from '../components/HotspotFontSettings'
import { PanoHotspotsOverlay } from '../components/PanoHotspotsOverlay'
import { RoomZoneMap } from '../components/RoomZoneMap'
import { SceneLocationLabel } from '../components/SceneLocationLabel'
import { hotspotsForScene } from '../data/hotspots'
import {
  SCENE_CROSSFADE_MS,
  useSceneCrossfade,
} from '../hooks/useSceneCrossfade'
import { useHotspotFontPreference } from '../hooks/useHotspotFontPreference'
import { preloadPanoramasAroundScene } from '../lib/panoPreload'
import {
  adjacentScene,
  isSceneId,
  nextSceneOrWrap,
  panoramaPath,
} from '../scenes'

type PanoViewerInstance = InstanceType<typeof PanoViewer>

export function TourPage() {
  const { sceneId: sceneParam = '' } = useParams<{ sceneId: string }>()

  const sceneId = isSceneId(sceneParam) ? sceneParam : null
  const { displayedId, dimmed } = useSceneCrossfade(sceneId ?? '00')

  if (!sceneId) {
    return <Navigate to="/tour/00" replace />
  }

  const panoRef = useRef<PanoViewerInstance | null>(null)
  const panoShellRef = useRef<HTMLDivElement | null>(null)
  const [viewTick, setViewTick] = useState(0)
  const bumpPanoLayout = useCallback(() => {
    setViewTick((t) => t + 1)
  }, [])

  const src = panoramaPath(displayedId)
  const panoHotspots = hotspotsForScene(displayedId)
  const hotspotsOverlayKey = `${displayedId}:${panoHotspots.map((h) => h.to).join(',')}`
  const prevScene = adjacentScene(sceneId, -1)
  const nextScene = nextSceneOrWrap(sceneId)
  const isLastScene = adjacentScene(sceneId, 1) === null

  const [hotspotFont, setHotspotFont] = useHotspotFontPreference()

  useEffect(() => {
    const cancelSecondRing = preloadPanoramasAroundScene(sceneId)
    return cancelSecondRing
  }, [sceneId])

  return (
    <div className="flex h-dvh w-full flex-col bg-zinc-950 text-zinc-100">
      <main className="relative min-h-0 flex-1 bg-zinc-950">
        <div
          ref={panoShellRef}
          className={`relative h-full w-full transition-[opacity] ease-in-out ${
            dimmed ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          style={{ transitionDuration: `${SCENE_CROSSFADE_MS}ms` }}
        >
          <PanoViewer
            ref={panoRef}
            key={displayedId}
            className="h-full w-full outline-none"
            image={src}
            projectionType="equirectangular"
            useKeyboard
            useZoom
            onReady={bumpPanoLayout}
            onViewChange={bumpPanoLayout}
          />
          <PanoHotspotsOverlay
            key={hotspotsOverlayKey}
            sceneId={displayedId}
            hotspots={panoHotspots}
            panoRef={panoRef}
            containerRef={panoShellRef}
            viewTick={viewTick}
          />
        </div>

        <SceneLocationLabel sceneId={sceneId} />

        <RoomZoneMap currentSceneId={sceneId} />

        <nav
          className="pointer-events-none absolute bottom-4 right-4 z-20 flex items-center gap-2 sm:bottom-5 sm:right-5"
          aria-label="Навигация по порядку точек тура"
        >
          {prevScene ? (
            <Link
              to={`/tour/${prevScene}`}
              className="pb-1 pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950/90 text-lg text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-cyan-500/60 hover:bg-zinc-900 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              title={`Предыдущая точка (${prevScene})`}
              aria-label={`Предыдущая точка ${prevScene}`}
            >
              ←
            </Link>
          ) : (
            <span
              className="pb-1 flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/60 text-lg text-zinc-600"
              aria-disabled="true"
              title="Это первая точка маршрута"
            >
              ←
            </span>
          )}
          <Link
            to={`/tour/${nextScene}`}
            className="pb-1 pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950/90 text-lg text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-cyan-500/60 hover:bg-zinc-900 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            title={
              isLastScene
                ? `С начала маршрута (${nextScene})`
                : `Следующая точка (${nextScene})`
            }
            aria-label={
              isLastScene
                ? `С начала маршрута, точка ${nextScene}`
                : `Следующая точка ${nextScene}`
            }
          >
            →
          </Link>
        </nav>

        <HotspotFontSettings size={hotspotFont} onChange={setHotspotFont} />
      </main>
    </div>
  )
}
