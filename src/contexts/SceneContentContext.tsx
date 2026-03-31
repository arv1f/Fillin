import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  mergeWithDefaults,
  type PublicCopyPayload,
} from '../data/sceneCopyDefaults'
import type { SceneZoneKind } from '../sceneZoneTypes'
import type { SceneId } from '../scenes'

type SceneContentContextValue = {
  /** Слитые данные (дефолты + API). */
  copy: PublicCopyPayload
  /** Загрузка с сервера завершена (успех или ошибка — остаются дефолты). */
  ready: boolean
  /** Перезагрузить с API (после сохранения в админке). */
  refresh: () => Promise<void>
}

const SceneContentContext = createContext<SceneContentContextValue | null>(
  null,
)

function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? ''
}

export function SceneContentProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<Partial<PublicCopyPayload> | null>(
    null,
  )
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${apiBase()}/api/public/copy`)
      if (!r.ok) throw new Error(String(r.status))
      const data = (await r.json()) as PublicCopyPayload
      setPayload(data)
    } catch {
      setPayload(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const copy = useMemo(() => mergeWithDefaults(payload), [payload])

  const value = useMemo<SceneContentContextValue>(
    () => ({
      copy,
      ready,
      refresh,
    }),
    [copy, ready, refresh],
  )

  return (
    <SceneContentContext.Provider value={value}>
      {children}
    </SceneContentContext.Provider>
  )
}

export function useSceneContent(): SceneContentContextValue {
  const ctx = useContext(SceneContentContext)
  if (!ctx) {
    throw new Error('useSceneContent must be used inside SceneContentProvider')
  }
  return ctx
}

/** Название точки (панорамы) по id — для кнопок и подписи «место». */
export function useSceneTitle(sceneId: SceneId): string {
  const { copy } = useSceneContent()
  return copy.scenes[sceneId] ?? `Точка ${sceneId}`
}

/** Левая часть «зона — …» по номеру сцены. */
export function useRoomZoneTitle(sceneId: SceneId): string {
  const { copy } = useSceneContent()
  const n = Number.parseInt(sceneId, 10)
  if (Number.isNaN(n)) return copy.zones.other?.title ?? 'Зона'
  if (n >= 0 && n <= 12) return copy.zones.corridor!.title
  if (n >= 14 && n <= 16) return copy.zones.second!.title
  if (n >= 17 && n <= 20) return copy.zones.interactive!.title
  if (n >= 21 && n <= 24) return copy.zones.historical!.title
  return copy.zones.other?.title ?? 'Зона'
}

export function useZoneTitle(kind: Exclude<SceneZoneKind, 'other'>): string {
  const { copy } = useSceneContent()
  return copy.zones[kind]?.title ?? kind
}

export function useZoneMapRange(
  kind: Exclude<SceneZoneKind, 'other'>,
): string {
  const { copy } = useSceneContent()
  return copy.zones[kind]?.mapRange ?? ''
}

export function useUiString(key: string, fallback: string): string {
  const { copy } = useSceneContent()
  const v = copy.ui[key]
  return typeof v === 'string' && v.trim() ? v : fallback
}
