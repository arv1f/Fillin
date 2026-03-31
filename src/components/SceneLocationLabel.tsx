import {
  useRoomZoneTitle,
  useSceneTitle,
} from '../contexts/SceneContentContext'
import type { SceneId } from '../scenes'

type Props = {
  sceneId: SceneId
}

export function SceneLocationLabel({ sceneId }: Props) {
  const room = useRoomZoneTitle(sceneId)
  const place = useSceneTitle(sceneId)

  return (
    <div
      className="pointer-events-none absolute left-4 top-4 z-20 max-w-[min(22rem,88vw)] sm:left-5 sm:top-5"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="rounded-lg border border-zinc-700/90 bg-zinc-950/90 px-3 py-2 shadow-lg backdrop-blur-md">
        <p className="text-xs font-medium leading-snug text-zinc-400 sm:text-sm">
          <span className="text-zinc-300">{room}</span>
          <span className="mx-1.5 text-zinc-600" aria-hidden="true">
            —
          </span>
          <span className="font-semibold text-cyan-100">{place}</span>
        </p>
      </div>
    </div>
  )
}
