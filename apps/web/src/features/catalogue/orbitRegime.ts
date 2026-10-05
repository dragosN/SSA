import type { OrbitRegime } from './types'

/**
 * Heuristic orbit regime from mean motion (rev/day) and eccentricity.
 * Not a formal SSA classification — good enough for demo filtering.
 */
export function classifyOrbitRegime(
  meanMotion: number,
  eccentricity: number,
): OrbitRegime {
  if (!Number.isFinite(meanMotion) || meanMotion <= 0) return 'UNKNOWN'
  if (eccentricity >= 0.25) return 'HEO'
  if (meanMotion >= 0.9 && meanMotion <= 1.1) return 'GEO'
  if (meanMotion >= 11.25) return 'LEO'
  if (meanMotion > 1.1 && meanMotion < 11.25) return 'MEO'
  return 'UNKNOWN'
}
