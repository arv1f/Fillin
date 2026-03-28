import type { SceneId } from '../scenes'

/** Одна подпись на каждую панораму-назначение — для всех хотспотов с этим `to`. */
const DESTINATION_LABELS: Record<SceneId, string> = {
  '00': 'Вход',
  '01': 'Первый баннер',
  '02': 'Второй баннер',
  '03': 'Третий баннер',
  '04': 'Четвертый баннер',
  '05': 'Пятый баннер',
  '06': 'Шестой баннер',
  '07': 'Инфо-бар',
  '08': 'Схемы',
  '09': 'Творчество',
  '10': 'Карта России',
  '11': 'Краткая сводка',
  '12': 'Ядро',
  '14': 'Мини станция',
  '15': 'Ветряки',
  '16': 'Стено-схема',
  '17': 'Тренажёр',
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

/**
 * Группа помещения по номеру сцены (для подписи «комната — точка»).
 * 00–12 Коридор; 14–16 вторая комната; 17–20 интерактивная; 21–24 историческая.
 */
export function roomZoneLabel(sceneId: SceneId): string {
  const n = Number.parseInt(sceneId, 10)
  if (Number.isNaN(n)) return 'Зона'
  if (n >= 0 && n <= 12) return 'Коридор'
  if (n >= 14 && n <= 16) return 'Вторая комната'
  if (n >= 17 && n <= 20) return 'Интерактивная комната'
  if (n >= 21 && n <= 24) return 'Историческая комната'
  return 'Зона'
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
