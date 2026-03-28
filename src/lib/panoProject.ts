export type Vec3 = readonly [number, number, number]

const DEG = Math.PI / 180

/** Минимальная сторона зоны клика (px). */
export const HOTSPOT_MIN_PX = 56

/** Верхняя граница размера сферического хотспота (px); плюс опционально на каждом хотспоте. */
export const HOTSPOT_MAX_W_PX = 220
export const HOTSPOT_MAX_H_PX = 200

const HOTSPOT_BASE_W = 104
const HOTSPOT_BASE_H = 80

/** Направление из центра сферы к точке панорамы (как у lookAt: yaw, pitch в градусах). */
export function worldDirFromYawPitch(yawDeg: number, pitchDeg: number): Vec3 {
  const y = yawDeg * DEG
  const p = pitchDeg * DEG
  return [
    -Math.sin(y),
    Math.sin(p) * Math.cos(y),
    -Math.cos(p) * Math.cos(y),
  ]
}

function rotateX(v: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]]
}

function rotateY(v: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]
}

/** Вектор в пространстве «камеры» View360: vEye = Ry(-yaw) * Rx(-pitch) * vWorld */
export function worldToCameraSpace(
  world: Vec3,
  yawDeg: number,
  pitchDeg: number,
): Vec3 {
  const y = yawDeg * DEG
  const p = pitchDeg * DEG
  let v: Vec3 = [world[0], world[1], world[2]]
  v = rotateX(v, -p)
  v = rotateY(v, -y)
  return v
}

export type ScreenRect = {
  left: number
  top: number
  width: number
  height: number
  visible: boolean
}

function projectToPixel(
  containerWidth: number,
  containerHeight: number,
  cameraYawDeg: number,
  cameraPitchDeg: number,
  fovDeg: number,
  yawDeg: number,
  pitchDeg: number,
): { x: number; y: number } | null {
  const aspect = containerWidth / Math.max(containerHeight, 1)
  const tanHalfY = Math.tan((fovDeg * DEG) / 2)
  const tanHalfX = tanHalfY * aspect

  const world = worldDirFromYawPitch(yawDeg, pitchDeg)
  const cam = worldToCameraSpace(world, cameraYawDeg, cameraPitchDeg)
  const cz = cam[2]
  if (cz >= -1e-4) return null

  const invZ = -1 / cz
  const ndcX = (cam[0] * invZ) / tanHalfX
  const ndcY = (cam[1] * invZ) / tanHalfY
  const px = ((ndcX + 1) / 2) * containerWidth
  const py = ((1 - ndcY) / 2) * containerHeight
  return { x: px, y: py }
}

/**
 * Четыре точки (x,y) в долях 0..1 от области панорамы → нормализованный прямоугольник (bbox).
 * Порядок углов любой; ось «экрана» поверх вьюпорта — при вращении 360° кнопка не ездит.
 */
export type ScreenCornerQuad = readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
]

export function normRectFromCorners(
  corners: ScreenCornerQuad,
): { x: number; y: number; w: number; h: number } {
  const xs = corners.map((c) => c[0])
  const ys = corners.map((c) => c[1])
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = Math.min(...ys)
  const y1 = Math.max(...ys)
  const clamp = (t: number) => Math.min(1, Math.max(0, t))
  const x = clamp(x0)
  const y = clamp(y0)
  const w = Math.max(0, clamp(x1) - x)
  const h = Math.max(0, clamp(y1) - y)
  return { x, y, w, h }
}

export function normRectToPixels(
  norm: { x: number; y: number; w: number; h: number },
  cw: number,
  ch: number,
): ScreenRect {
  const left = norm.x * cw
  const top = norm.y * ch
  const width = Math.max(0, norm.w * cw)
  const height = Math.max(0, norm.h * ch)
  const visible = width >= 4 && height >= 4
  return { left, top, width, height, visible }
}

function pixelSpanPerDegreeYaw(
  cw: number,
  ch: number,
  cameraYawDeg: number,
  cameraPitchDeg: number,
  fovDeg: number,
  centerYawDeg: number,
  centerPitchDeg: number,
  epsDeg: number,
): number {
  const c = projectToPixel(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg,
    centerPitchDeg,
  )
  const pr = projectToPixel(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg + epsDeg,
    centerPitchDeg,
  )
  const pl = projectToPixel(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg - epsDeg,
    centerPitchDeg,
  )
  if (pr && pl) {
    return Math.hypot(pr.x - pl.x, pr.y - pl.y) / (2 * epsDeg)
  }
  if (pr && c) {
    return Math.hypot(pr.x - c.x, pr.y - c.y) / epsDeg
  }
  if (pl && c) {
    return Math.hypot(c.x - pl.x, c.y - pl.y) / epsDeg
  }
  return HOTSPOT_BASE_W / 10
}

function pixelSpanPerDegreePitch(
  cw: number,
  ch: number,
  cameraYawDeg: number,
  cameraPitchDeg: number,
  fovDeg: number,
  centerYawDeg: number,
  centerPitchDeg: number,
  epsDeg: number,
): number {
  const c = projectToPixel(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg,
    centerPitchDeg,
  )
  const pu = projectToPixel(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg,
    centerPitchDeg + epsDeg,
  )
  const pd = projectToPixel(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg,
    centerPitchDeg - epsDeg,
  )
  if (pu && pd) {
    return Math.hypot(pu.x - pd.x, pu.y - pd.y) / (2 * epsDeg)
  }
  if (pu && c) {
    return Math.hypot(pu.x - c.x, pu.y - c.y) / epsDeg
  }
  if (pd && c) {
    return Math.hypot(c.x - pd.x, c.y - pd.y) / epsDeg
  }
  return HOTSPOT_BASE_H / 8
}

export type YawPitchRectCaps = {
  maxWidthPx?: number
  maxHeightPx?: number
}

/**
 * Сферический хотспот: размер из полуразмахов в градусах × локальная «пикс/°» у центра.
 * (Bbox по четырём углам на сфере давал гигантский прямоугольник у края экрана.)
 */
export function projectYawPitchRect(
  containerWidth: number,
  containerHeight: number,
  cameraYawDeg: number,
  cameraPitchDeg: number,
  fovDeg: number,
  centerYawDeg: number,
  centerPitchDeg: number,
  yawHalfSpanDeg: number,
  pitchHalfSpanDeg: number,
  caps?: YawPitchRectCaps,
): ScreenRect {
  const cw = containerWidth
  const ch = containerHeight

  const c = projectToPixel(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg,
    centerPitchDeg,
  )
  if (!c) {
    return { left: 0, top: 0, width: 0, height: 0, visible: false }
  }

  const eps = 0.4
  const kx = pixelSpanPerDegreeYaw(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg,
    centerPitchDeg,
    eps,
  )
  const ky = pixelSpanPerDegreePitch(
    cw,
    ch,
    cameraYawDeg,
    cameraPitchDeg,
    fovDeg,
    centerYawDeg,
    centerPitchDeg,
    eps,
  )

  let width = 2 * yawHalfSpanDeg * kx
  let height = 2 * pitchHalfSpanDeg * ky

  const angularAspect =
    pitchHalfSpanDeg > 1e-6 ? yawHalfSpanDeg / pitchHalfSpanDeg : 1
  const wScale = Math.min(Math.max(angularAspect, 0.55), 2.2)
  if (width < 4 || height < 4) {
    width = Math.round(HOTSPOT_BASE_W * wScale)
    height = HOTSPOT_BASE_H
  }

  width = Math.max(width, HOTSPOT_MIN_PX)
  height = Math.max(height, HOTSPOT_MIN_PX)

  const maxW = Math.min(
    caps?.maxWidthPx ?? HOTSPOT_MAX_W_PX,
    Math.floor(cw * 0.4),
  )
  const maxH = Math.min(
    caps?.maxHeightPx ?? HOTSPOT_MAX_H_PX,
    Math.floor(ch * 0.38),
  )
  width = Math.min(width, maxW)
  height = Math.min(height, maxH)

  let left = c.x - width / 2
  let top = c.y - height / 2

  if (left + width > cw) left = Math.max(0, cw - width)
  if (top + height > ch) top = Math.max(0, ch - height)
  if (left < 0) left = 0
  if (top < 0) top = 0

  return {
    left,
    top,
    width,
    height,
    visible: true,
  }
}
