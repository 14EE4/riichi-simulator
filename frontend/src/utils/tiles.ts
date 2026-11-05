// Convert mjai tile notations (E, S, W, N, P, F, C, 5mr, etc.) to mahgen notations (1z, 2z, ..., 0m, etc.)
export const MJAI_TO_MAHGEN: Record<string, string> = {
  E: '1z',
  S: '2z',
  W: '3z',
  N: '4z',
  P: '5z',
  F: '6z',
  C: '7z',
  '5mr': '0m',
  '5pr': '0p',
  '5sr': '0s',
}

export function toMahgen(tile: string): string {
  return MJAI_TO_MAHGEN[tile] || tile
}

export const MAHGEN_TO_MJAI: Record<string, string> = {
  '1z': 'E',
  '2z': 'S',
  '3z': 'W',
  '4z': 'N',
  '5z': 'P',
  '6z': 'F',
  '7z': 'C',
  '0m': '5mr',
  '0p': '5pr',
  '0s': '5sr',
}

export function toMjai(tile: string): string {
  return MAHGEN_TO_MJAI[tile] || tile
}

export function formatKyoku(bakaze: string, kyoku: number, honba: number): string {
  const windMap: Record<string, string> = { E: '동', S: '남', W: '서', N: '북' }
  const wind = windMap[bakaze] || '동'
  return `${wind} ${kyoku}국 ${honba}본장`
}

export function formatShanten(shanten: number | null | undefined): string {
  if (shanten === null || shanten === undefined) return ''
  if (shanten === 0) return '텐파이 (Tenpai)'
  if (shanten === 1) return '이샹텐 (1-shanten)'
  if (shanten === 2) return '량샹텐 (2-shanten)'
  return `${shanten}샹텐`
}
