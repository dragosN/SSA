import type { OMMJsonObject } from 'satellite.js'

export type WorkerInitMessage = {
  type: 'init'
  objects: Array<{ noradId: number; omm: OMMJsonObject }>
}

export type WorkerTickMessage = {
  type: 'tick'
  /** Unix ms; defaults to Date.now() in the worker */
  timeMs?: number
}

export type WorkerSetIntervalMessage = {
  type: 'setIntervalMs'
  intervalMs: number
}

export type WorkerStartMessage = { type: 'start' }
export type WorkerStopMessage = { type: 'stop' }

export type MainToWorkerMessage =
  | WorkerInitMessage
  | WorkerTickMessage
  | WorkerSetIntervalMessage
  | WorkerStartMessage
  | WorkerStopMessage

/** Packed: [noradId, x, y, z, ...] ECEF meters for Cesium Cartesian3 */
export type WorkerPositionsMessage = {
  type: 'positions'
  timeMs: number
  data: Float64Array
}

export type WorkerReadyMessage = { type: 'ready'; count: number }
export type WorkerErrorMessage = { type: 'error'; message: string }

export type WorkerToMainMessage =
  | WorkerPositionsMessage
  | WorkerReadyMessage
  | WorkerErrorMessage
