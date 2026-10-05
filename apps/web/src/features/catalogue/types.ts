import type { OMMJsonObject } from 'satellite.js'

export type OrbitRegime = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'UNKNOWN'

export type CatalogueObject = {
  noradId: number
  name: string
  /** CelesTrak group tag used for operator/group filtering */
  group: string
  eccentricity: number
  meanMotion: number
  regime: OrbitRegime
  /** Full OMM record for SGP4 via satellite.js json2satrec */
  omm: OMMJsonObject
}

export type EciPosition = {
  noradId: number
  x: number
  y: number
  z: number
}
