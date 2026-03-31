/**
 * Тексты в БД привязаны к уже заданным в коде точкам, зонам и ключам UI.
 * Новые панорамы и геометрия хотспотов не добавляются через API.
 */
import { DEFAULT_UI_STRINGS } from '../src/data/sceneCopyDefaults.ts'
import { SCENE_IDS } from '../src/scenes.ts'

export const ALLOWED_SCENE_IDS = new Set<string>(SCENE_IDS)

export const ALLOWED_ZONE_KEYS = new Set<string>([
  'corridor',
  'second',
  'interactive',
  'historical',
  'other',
])

export const ALLOWED_UI_KEYS = new Set(Object.keys(DEFAULT_UI_STRINGS))
