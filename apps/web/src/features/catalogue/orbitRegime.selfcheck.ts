import { classifyOrbitRegime } from './orbitRegime'

/** Lightweight assertions runnable with node --experimental-strip-types later; kept as pure functions for Phase 4 Jest. */
export function assertRegimeClassification(): void {
  const cases: Array<[number, number, string]> = [
    [15.5, 0.001, 'LEO'],
    [1.0027, 0.0001, 'GEO'],
    [4.0, 0.01, 'MEO'],
    [2.0, 0.4, 'HEO'],
  ]
  for (const [n, e, expected] of cases) {
    const got = classifyOrbitRegime(n, e)
    if (got !== expected) {
      throw new Error(`expected ${expected} for n=${n} e=${e}, got ${got}`)
    }
  }
}
