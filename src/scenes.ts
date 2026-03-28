/** Допустимые панорамы: 00–24, узел 13 отсутствует. */
export const SCENE_IDS = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
] as const

export type SceneId = (typeof SCENE_IDS)[number]

const idSet = new Set<string>(SCENE_IDS)

export function isSceneId(value: string): value is SceneId {
  return idSet.has(value)
}

export function panoramaPath(id: SceneId): string {
  return `/MainJPG/${id}.jpg`
}

export function sceneIndex(id: SceneId): number {
  return SCENE_IDS.indexOf(id)
}

export function adjacentScene(
  id: SceneId,
  delta: -1 | 1,
): SceneId | null {
  const i = sceneIndex(id) + delta
  if (i < 0 || i >= SCENE_IDS.length) return null
  return SCENE_IDS[i]!
}
