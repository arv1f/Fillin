import { HOTSPOTS_BY_SCENE } from '../data/hotspots'
import { adjacentScene, panoramaPath, type SceneId } from '../scenes'

const preloadedPaths = new Set<string>()

/** Предзагрузка JPEG в кэш браузера (соседи по маршруту и по хотспотам). */
export function preloadPanoramaPath(path: string): void {
  if (preloadedPaths.has(path)) return
  preloadedPaths.add(path)
  const img = new Image()
  img.decoding = 'async'
  img.src = path
}

/** Все разумные следующие сцены: prev/next в SCENE_IDS + все `to` с текущей панорамы. */
export function preloadPanoramasAroundScene(sceneId: SceneId): void {
  const ids = new Set<SceneId>()
  const prev = adjacentScene(sceneId, -1)
  const next = adjacentScene(sceneId, 1)
  if (prev) ids.add(prev)
  if (next) ids.add(next)
  const hs = HOTSPOTS_BY_SCENE[sceneId]
  if (hs) {
    for (const h of hs) ids.add(h.to)
  }
  for (const id of ids) {
    preloadPanoramaPath(panoramaPath(id))
  }
}
