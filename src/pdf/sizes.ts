export const PT_PER_MM = 72 / 25.4

export function mm(n: number): number {
  return n * PT_PER_MM
}

export const QR_MM = 20

export const PAGE_SIZES = {
  a5: { name: 'a5' as const, width: mm(148), height: mm(210) },
  a6: { name: 'a6' as const, width: mm(105), height: mm(148) },
}

export type PageBox = (typeof PAGE_SIZES)[keyof typeof PAGE_SIZES]
