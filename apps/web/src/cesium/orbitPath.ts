import type { OMMJsonObject } from 'satellite.js'
import { json2satrec, propagate, gstime, eciToEcf } from 'satellite.js'
import { Cartesian3 } from 'cesium'

/** Sample one orbital revolution as ECEF Cartesian3 positions (meters). */
export function sampleOrbitPath(
  omm: OMMJsonObject,
  samples = 90,
  startMs = Date.now(),
): Cartesian3[] {
  const satrec = json2satrec(omm)
  const meanMotion = Number(omm.MEAN_MOTION)
  if (!Number.isFinite(meanMotion) || meanMotion <= 0) return []

  const periodMs = (86400 / meanMotion) * 1000
  const points: Cartesian3[] = []

  for (let i = 0; i <= samples; i++) {
    const t = startMs + (periodMs * i) / samples
    const date = new Date(t)
      const result = propagate(satrec, date)
      if (!result) continue
      const position = result.position
      if (!position || typeof position === 'boolean') continue
    const ecf = eciToEcf(position, gstime(date))
    points.push(new Cartesian3(ecf.x * 1000, ecf.y * 1000, ecf.z * 1000))
  }

  return points
}
