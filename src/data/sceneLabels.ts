import type { SceneZoneKind } from '../sceneZoneTypes'
import type { SceneId } from '../scenes'

export type { SceneZoneKind }

/**
 * Группа помещения по номеру сцены (логика диапазонов — не из БД).
 * 00–12 Коридор; 14–16 вторая; 17–20 интерактивная; 21–24 историческая.
 */
export function sceneZoneKind(sceneId: SceneId): SceneZoneKind {
  const n = Number.parseInt(sceneId, 10)
  if (Number.isNaN(n)) return 'other'
  if (n >= 0 && n <= 12) return 'corridor'
  if (n >= 14 && n <= 16) return 'second'
  if (n >= 17 && n <= 20) return 'interactive'
  if (n >= 21 && n <= 24) return 'historical'
  return 'other'
}

/** Порядок зон на карте (какой «коридор» первый и т.д.). */
export const ZONE_MAP_ORDER: { kind: Exclude<SceneZoneKind, 'other'> }[] = [
  { kind: 'corridor' },
  { kind: 'second' },
  { kind: 'interactive' },
  { kind: 'historical' },
]

/** Первая точка зоны для перехода с карты. */
export function entrySceneForZone(kind: SceneZoneKind): SceneId | null {
  switch (kind) {
    case 'corridor':
      return '00'
    case 'second':
      return '14'
    case 'interactive':
      return '17'
    case 'historical':
      return '21'
    default:
      return null
  }
}
