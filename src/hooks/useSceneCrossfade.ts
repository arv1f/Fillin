import { useEffect, useRef, useState } from 'react'
import type { SceneId } from '../scenes'

/** Затемнение до смены кадра и обратное проявление (мс). Синхронизируйте с CSS transition на обёртке PanoViewer. */
export const SCENE_CROSSFADE_MS = 240

/**
 * Синхронизирует отображаемую панораму с URL с мягким переходом:
 * затемнение → смена кадра → проявление. При быстрых переходах
 * всегда подставляется последний sceneId из маршрута.
 */
export function useSceneCrossfade(sceneId: SceneId) {
  const [displayedId, setDisplayedId] = useState<SceneId>(sceneId)
  const [dimmed, setDimmed] = useState(false)
  const latestIdRef = useRef(sceneId)
  latestIdRef.current = sceneId

  useEffect(() => {
    if (sceneId === displayedId) {
      setDimmed(false)
      return
    }

    setDimmed(true)
    const t = window.setTimeout(() => {
      setDisplayedId(latestIdRef.current)
      requestAnimationFrame(() => {
        setDimmed(false)
      })
    }, SCENE_CROSSFADE_MS)

    return () => window.clearTimeout(t)
  }, [sceneId, displayedId])

  return { displayedId, dimmed }
}
