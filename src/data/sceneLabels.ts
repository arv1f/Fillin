import type { SceneId } from '../scenes'

/**
 * Подписи панорам (точек маршрута):
 * — верхний блок «зона — название точки»: `destinationLabel(sceneId)`;
 * — текст на кнопках перехода: `destinationLabel(hotspot.to)`.
 */
const DESTINATION_LABELS: Record<SceneId, string> = {
  '00': 'Вход',
  '01': 'Первый баннер',
  '02': 'Второй баннер',
  '03': 'Третий баннер',
  '04': 'Четвертый баннер',
  '05': 'Пятый баннер',
  '06': 'Шестой баннер',
  '07': 'Инфо-бар',
  '08': 'Кабинет диспетчека',
  '09': 'Информационная витрина',
  '10': 'Карта России',
  '11': 'Краткая сводка',
  '12': 'Ядро',
  '14': 'Интерактивный макет',
  '15': 'Источники энергии',
  '16': 'Стено-схема',
  '17': 'Игровой зал',
  '18': 'Игр автомат 1',
  '19': 'Игр автомат 2',
  '20': '3D модель',
  '21': 'Сводка известий',
  '22': 'Исторические табло',
  '23': 'Стол главного инженера',
  '24': 'Исторические табло и телевизор',
}

export function destinationLabel(id: SceneId): string {
  return DESTINATION_LABELS[id] ?? `Точка ${id}`
}

/** Тип зоны для карты и подсветки. */
export type SceneZoneKind =
  | 'corridor'
  | 'second'
  | 'interactive'
  | 'historical'
  | 'other'

export function sceneZoneKind(sceneId: SceneId): SceneZoneKind {
  const n = Number.parseInt(sceneId, 10)
  if (Number.isNaN(n)) return 'other'
  if (n >= 0 && n <= 12) return 'corridor'
  if (n >= 14 && n <= 16) return 'second'
  if (n >= 17 && n <= 20) return 'interactive'
  if (n >= 21 && n <= 24) return 'historical'
  return 'other'
}

/**
 * Названия зон (левая часть подписи «зона — точка» и карта «Карта зон»).
 * Меняйте строки здесь — везде подтянется одно и то же.
 */
export const ZONE_LABELS: Record<
  Exclude<SceneZoneKind, 'other'>,
  string
> = {
  corridor: 'Коридор',
  second: 'Вторая комната',
  interactive: 'Интерактивная комната',
  historical: 'Историческая комната',
}

/** Диапазоны точек на карте зон (подписи диапазонов — отдельно от названий зон). */
export const ZONE_MAP_RANGES: {
  kind: Exclude<SceneZoneKind, 'other'>
  range: string
}[] = [
  { kind: 'corridor', range: '00–12' },
  { kind: 'second', range: '14–16' },
  { kind: 'interactive', range: '17–20' },
  { kind: 'historical', range: '21–24' },
]

export function roomZoneLabel(sceneId: SceneId): string {
  const k = sceneZoneKind(sceneId)
  if (k === 'other') return 'Зона'
  return ZONE_LABELS[k]
}

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
