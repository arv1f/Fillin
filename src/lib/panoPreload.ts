import { HOTSPOTS_BY_SCENE } from '../data/hotspots'
import { adjacentScene, panoramaPath, type SceneId } from '../scenes'

const preloadedPaths = new Set<string>()

/** Предзагрузка JPEG в кэш браузера. */
export function preloadPanoramaPath(path: string): void {
  if (preloadedPaths.has(path)) return
  preloadedPaths.add(path)
  const img = new Image()
  img.decoding = 'async'
  img.src = path
}

/** Prev/next по маршруту + все `to` с указанной сцены. */
function collectFirstRingSceneIds(sceneId: SceneId): SceneId[] {
  const ids = new Set<SceneId>()
  const prev = adjacentScene(sceneId, -1)
  const next = adjacentScene(sceneId, 1)
  if (prev) ids.add(prev)
  if (next) ids.add(next)
  const hs = HOTSPOTS_BY_SCENE[sceneId]
  if (hs) {
    for (const h of hs) ids.add(h.to)
  }
  return [...ids]
}

/** Соседи соседей (второй круг), без текущей сцены и без первого круга. */
function collectSecondRingSceneIds(
  sceneId: SceneId,
  firstRing: readonly SceneId[],
): SceneId[] {
  const exclude = new Set<SceneId>([sceneId, ...firstRing])
  const out = new Set<SceneId>()
  for (const nid of firstRing) {
    for (const mid of collectFirstRingSceneIds(nid)) {
      if (!exclude.has(mid)) out.add(mid)
    }
  }
  return [...out]
}

type IdleHandle = number

function scheduleIdle(fn: () => void, timeoutMs: number): IdleHandle {
  const ric = window.requestIdleCallback
  if (typeof ric === 'function') {
    return ric(fn, { timeout: timeoutMs })
  }
  return window.setTimeout(fn, 300) as unknown as number
}

function cancelIdle(handle: IdleHandle): void {
  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle)
  } else {
    window.clearTimeout(handle)
  }
}

/**
 * 1) Сразу: prev/next + хотспоты текущей сцены.
 * 2) В requestIdleCallback: «второй круг» — соседи всех из первого круга.
 * Возвращает функцию отмены второго этапа (при быстрой смене сцены).
 */
export function preloadPanoramasAroundScene(sceneId: SceneId): () => void {
  const first = collectFirstRingSceneIds(sceneId)
  for (const id of first) {
    preloadPanoramaPath(panoramaPath(id))
  }

  let cancelled = false
  const handle = scheduleIdle(() => {
    if (cancelled) return
    const second = collectSecondRingSceneIds(sceneId, first)
    for (const id of second) {
      preloadPanoramaPath(panoramaPath(id))
    }
  }, 2000)

  return () => {
    cancelled = true
    cancelIdle(handle)
  }
}
