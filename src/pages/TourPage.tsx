import { PanoViewer } from '@egjs/react-view360'
import { useCallback, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PanoHotspotsOverlay } from '../components/PanoHotspotsOverlay'
import { hotspotsForScene } from '../data/hotspots'
import {
  SCENE_CROSSFADE_MS,
  useSceneCrossfade,
} from '../hooks/useSceneCrossfade'
import {
  adjacentScene,
  isSceneId,
  panoramaPath,
  sceneIndex,
  SCENE_IDS,
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

  const index = sceneIndex(sceneId)
  const prev = adjacentScene(sceneId, -1)
  const next = adjacentScene(sceneId, 1)
  const src = panoramaPath(displayedId)
  const total = SCENE_IDS.length

  return (
    <div className="flex h-dvh w-full flex-col bg-zinc-950 text-zinc-100">
      <header className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div>
          <h1 className="text-sm font-medium tracking-tight">Виртуальный тур</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Точка {index + 1} из {total} · {panoramaPath(sceneId)}
          </p>
        </div>
        <nav
          className="flex items-center gap-2"
          aria-label="Навигация по точкам тура"
        >
          {prev ? (
            <Link
              to={`/tour/${prev}`}
              className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              ← Назад
            </Link>
          ) : (
            <span className="rounded-md border border-transparent px-3 py-1.5 text-xs text-zinc-600">
              ← Назад
            </span>
          )}
          {next ? (
            <Link
              to={`/tour/${next}`}
              className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Вперёд →
            </Link>
          ) : (
            <span className="rounded-md border border-transparent px-3 py-1.5 text-xs text-zinc-600">
              Вперёд →
            </span>
          )}
        </nav>
      </header>
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
            sceneId={displayedId}
            hotspots={hotspotsForScene(displayedId)}
            panoRef={panoRef}
            containerRef={panoShellRef}
            viewTick={viewTick}
          />
        </div>
      </main>
    </div>
  )
}
