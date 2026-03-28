type Rect = {
  left: number
  top: number
  width: number
  height: number
}

function overlap(a: Rect, b: Rect, gap: number): boolean {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  )
}

/**
 * Сдвигает пересекающиеся зоны: сначала вниз, затем при необходимости вправо.
 * Мутирует объекты в массиве.
 */
export function separateOverlappingRects(
  rects: Rect[],
  cw: number,
  ch: number,
  gap = 8,
): void {
  const n = rects.length
  if (n < 2) return

  const indices = () => [...rects.keys()].sort(
    (a, b) => rects[a]!.top - rects[b]!.top || rects[a]!.left - rects[b]!.left,
  )

  for (let pass = 0; pass < 40; pass++) {
    const ord = indices()
    let changed = false
    for (let k = 1; k < ord.length; k++) {
      const i = ord[k]!
      const A = rects[i]!
      for (let p = 0; p < k; p++) {
        const j = ord[p]!
        const B = rects[j]!
        if (!overlap(A, B, gap)) continue
        const need = B.top + B.height + gap - A.top
        if (need > 0) {
          A.top += need
          changed = true
        }
      }
    }
    if (!changed) break
  }

  for (let pass = 0; pass < 20; pass++) {
    const ord = indices()
    let changed = false
    for (let k = 1; k < ord.length; k++) {
      const i = ord[k]!
      const A = rects[i]!
      for (let p = 0; p < k; p++) {
        const j = ord[p]!
        const B = rects[j]!
        if (!overlap(A, B, gap)) continue
        const needRight = B.left + B.width + gap - A.left
        if (needRight > 0 && A.left + needRight + A.width <= cw) {
          A.left += needRight
          changed = true
        }
      }
    }
    if (!changed) break
  }

  for (let i = 0; i < n; i++) {
    const r = rects[i]!
    r.top = Math.max(0, Math.min(r.top, ch - r.height))
    r.left = Math.max(0, Math.min(r.left, cw - r.width))
  }
}
