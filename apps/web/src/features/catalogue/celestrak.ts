import type { OMMJsonObject } from 'satellite.js'
import { classifyOrbitRegime } from './orbitRegime'
import { FALLBACK_CATALOGUE_OMM } from './fallbackCatalogue'
import type { CatalogueObject } from './types'

/** Soft cap so the demo stays interactive on a laptop GPU. */
export const MAX_CATALOGUE_OBJECTS = 2500

/** Fast first paint — small lists (also bundled under public/catalogue). */
export const CELESTRAK_GROUPS_INITIAL = [
  { id: 'stations', label: 'Space stations' },
  { id: 'visual', label: 'Visual' },
] as const

/** Loaded in the background after the globe is up. */
export const CELESTRAK_GROUPS_EXTENDED = [
  { id: 'active', label: 'Active' },
] as const

export const CELESTRAK_GROUPS = [
  ...CELESTRAK_GROUPS_INITIAL,
  ...CELESTRAK_GROUPS_EXTENDED,
  { id: 'starlink', label: 'Starlink' },
] as const

const LOCAL_TIMEOUT_MS = 8_000
const MIRROR_TIMEOUT_MS = 15_000
/** Small groups; fail fast when the ISP path is dead. */
const CELESTRAK_TIMEOUT_MS = 12_000
/** Larger pulls (e.g. active) need more headroom. */
const CELESTRAK_EXTENDED_TIMEOUT_MS = 45_000

/** GitHub mirror used when celestrak.org is unreachable. */
const SATVISOR_MIRROR =
  'https://raw.githubusercontent.com/satvisorcom/satvisor-data/master/celestrak/json'

/**
 * Once live CelesTrak fails in this page session, skip further attempts
 * (common on networks that drop HostPapa/Hostwinds routes).
 */
let celestrakBlocked = false

function asNumber(value: number | string | undefined, fallback = 0): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

function parseGpRecord(
  record: OMMJsonObject,
  group: string,
): CatalogueObject | null {
  const noradId = asNumber(record.NORAD_CAT_ID)
  if (!noradId || !record.EPOCH || record.MEAN_MOTION == null) return null

  const eccentricity = asNumber(record.ECCENTRICITY)
  const meanMotion = asNumber(record.MEAN_MOTION)

  return {
    noradId,
    name: (record.OBJECT_NAME ?? `NORAD ${noradId}`).trim(),
    group,
    eccentricity,
    meanMotion,
    regime: classifyOrbitRegime(meanMotion, eccentricity),
    omm: record,
  }
}

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController()
  window.setTimeout(() => controller.abort(), ms)
  return controller.signal
}

async function fetchJsonArray(
  url: string,
  signal: AbortSignal,
): Promise<OMMJsonObject[]> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = (await response.json()) as OMMJsonObject[]
  if (!Array.isArray(payload)) {
    throw new Error('Unexpected payload')
  }
  return payload
}

function celestrakTimeoutFor(group: string): number {
  return group === 'active' || group === 'starlink'
    ? CELESTRAK_EXTENDED_TIMEOUT_MS
    : CELESTRAK_TIMEOUT_MS
}

/**
 * Prefer live CelesTrak when the network path works; fall back to bundled /
 * GitHub mirror (home ISPs sometimes drop HostPapa routes to celestrak.org).
 *
 * Browser → celestrak.org is tried before the Vite proxy: the Node proxy often
 * fails DNS (ENOTFOUND → 502) when the dev server was started in a restricted
 * environment, even though the browser can reach the host.
 */
async function fetchGroup(group: string): Promise<{
  records: OMMJsonObject[]
  source: 'bundled' | 'celestrak' | 'mirror'
}> {
  const gpPath = `/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=json`
  const timeout = celestrakTimeoutFor(group)

  if (!celestrakBlocked) {
    const liveUrls = [
      `https://celestrak.org${gpPath}`,
      `/celestrak${gpPath}`,
    ]
    for (const url of liveUrls) {
      try {
        const records = await fetchJsonArray(url, withTimeout(timeout))
        return { records, source: 'celestrak' }
      } catch {
        // try next live URL
      }
    }
    celestrakBlocked = true
  }

  try {
    const records = await fetchJsonArray(
      `/catalogue/${group}.json`,
      withTimeout(LOCAL_TIMEOUT_MS),
    )
    return { records, source: 'bundled' }
  } catch {
    // continue
  }

  const mirrorUrls = [
    `/mirror/celestrak/${group}.json`,
    `${SATVISOR_MIRROR}/${group}.json`,
  ]
  for (const url of mirrorUrls) {
    try {
      const records = await fetchJsonArray(url, withTimeout(MIRROR_TIMEOUT_MS))
      return { records, source: 'mirror' }
    } catch {
      // try next
    }
  }

  throw new Error(`No source for group ${group}`)
}

function mergeRecords(
  byId: Map<number, CatalogueObject>,
  records: OMMJsonObject[],
  group: string,
  maxObjects: number,
) {
  for (const record of records) {
    if (byId.size >= maxObjects) break
    const obj = parseGpRecord(record, group)
    if (obj && !byId.has(obj.noradId)) {
      byId.set(obj.noradId, obj)
    }
  }
}

export function buildFallbackCatalogue(): CatalogueObject[] {
  const byId = new Map<number, CatalogueObject>()
  mergeRecords(byId, FALLBACK_CATALOGUE_OMM, 'stations', MAX_CATALOGUE_OBJECTS)
  return [...byId.values()]
}

export type CatalogueLoadResult = {
  objects: CatalogueObject[]
  source: 'celestrak' | 'bundled' | 'mirror' | 'fallback'
  warning?: string
}

/** Live CelesTrak first; bundled/mirror when the path is blocked. */
export async function fetchCelesTrakCatalogue(
  groups: readonly string[] = CELESTRAK_GROUPS_INITIAL.map((g) => g.id),
  maxObjects = MAX_CATALOGUE_OBJECTS,
): Promise<CatalogueLoadResult> {
  const byId = new Map<number, CatalogueObject>()
  const errors: string[] = []
  const sources = new Set<CatalogueLoadResult['source']>()

  const results = await Promise.allSettled(
    groups.map(async (group) => {
      const result = await fetchGroup(group)
      return { group, ...result }
    }),
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      mergeRecords(byId, result.value.records, result.value.group, maxObjects)
      sources.add(result.value.source)
    } else {
      const reason = result.reason as { message?: string }
      errors.push(reason?.message ?? 'request failed')
    }
  }

  if (byId.size === 0) {
    return {
      objects: buildFallbackCatalogue(),
      source: 'fallback',
      warning: `Catalogue unavailable (${errors.join('; ') || 'no data'}); using tiny offline sample`,
    }
  }

  const source: CatalogueLoadResult['source'] = sources.has('celestrak')
    ? 'celestrak'
    : sources.has('bundled')
      ? 'bundled'
      : sources.has('mirror')
        ? 'mirror'
        : 'fallback'

  return {
    objects: [...byId.values()],
    source,
    warning:
      errors.length > 0
        ? `Partial load: ${errors.join('; ')}`
        : source === 'bundled'
          ? 'Using bundled snapshot (CelesTrak unreachable on this network)'
          : source === 'mirror'
            ? 'Using GitHub mirror (CelesTrak unreachable)'
            : undefined,
  }
}
