import type { SceneId } from '../scenes'
import type { SceneZoneKind } from '../sceneZoneTypes'

/** Значения по умолчанию, если API недоступен или строка ещё не задана в БД. */
export const DEFAULT_SCENE_TITLES: Record<SceneId, string> = {
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

export type ZoneCopyKey = Exclude<SceneZoneKind, 'other'>

export type ZoneCopyRow = { title: string; mapRange: string }

export const DEFAULT_ZONE_COPY: Record<ZoneCopyKey | 'other', ZoneCopyRow> = {
  corridor: { title: 'Коридор', mapRange: '00–12' },
  second: { title: 'Вторая комната', mapRange: '14–16' },
  interactive: { title: 'Интерактивная комната', mapRange: '17–20' },
  historical: { title: 'Историческая комната', mapRange: '21–24' },
  other: { title: 'Зона', mapRange: '' },
}

/** Подписи интерфейса (кнопки, подсказки), не привязанные к номеру сцены. */
export const DEFAULT_UI_STRINGS: Record<string, string> = {
  room_zone_map_button: 'Карта зон',
  room_zone_map_hint:
    'Схема по зонам. Точки — ориентир по маршруту.',
  room_zone_map_open_title: 'Схема зон музея',
  room_zone_map_region_aria: 'Схематичная карта зон по номерам точек',
  tour_nav_aria: 'Навигация по порядку точек тура',
  tour_prev_title: 'Предыдущая точка',
  tour_prev_disabled: 'Это первая точка маршрута',
  tour_next_title: 'Следующая точка',
  tour_next_wrap: 'С начала маршрута',
  hotspot_font_toggle: 'Текст Aa',
  hotspot_font_panel_title: 'Размер текста на кнопках переходов',
  hotspot_font_group_aria: 'Размер шрифта на хотспотах',
  hotspot_font_heading: 'Подписи на кнопках',
  hotspot_font_sm: 'Мелкий',
  hotspot_font_md: 'Средний',
  hotspot_font_lg: 'Крупный',
}

export type PublicCopyPayload = {
  scenes: Record<string, string>
  zones: Record<
    string,
    { title: string; mapRange: string }
  >
  ui: Record<string, string>
}

export function mergeWithDefaults(payload: Partial<PublicCopyPayload> | null): PublicCopyPayload {
  const scenes = { ...DEFAULT_SCENE_TITLES } as Record<string, string>
  if (payload?.scenes) {
    for (const [k, v] of Object.entries(payload.scenes)) {
      if (typeof v === 'string' && v.trim()) scenes[k] = v
    }
  }
  const zones: PublicCopyPayload['zones'] = {}
  for (const key of Object.keys(DEFAULT_ZONE_COPY) as (keyof typeof DEFAULT_ZONE_COPY)[]) {
    const d = DEFAULT_ZONE_COPY[key]
    const p = payload?.zones?.[key]
    zones[key] = {
      title: p?.title?.trim() ? p.title : d.title,
      mapRange:
        key === 'other'
          ? ''
          : p?.mapRange?.trim()
            ? p.mapRange
            : d.mapRange,
    }
  }
  const ui = { ...DEFAULT_UI_STRINGS }
  if (payload?.ui) {
    for (const [k, v] of Object.entries(payload.ui)) {
      if (typeof v === 'string') ui[k] = v
    }
  }
  return { scenes, zones, ui }
}
