/// <reference lib="webworker" />
import { json2satrec, propagate, gstime, eciToEcf } from 'satellite.js'
import type { SatRec } from 'satellite.js'
import type { MainToWorkerMessage, WorkerToMainMessage } from './propagateProtocol'

type Tracked = {
  noradId: number
  satrec: SatRec
}

let tracked: Tracked[] = []
let timer: ReturnType<typeof setInterval> | null = null
let intervalMs = 1000

function post(msg: WorkerToMainMessage) {
  self.postMessage(msg)
}

/** Propagate to ECEF meters for direct Cesium Cartesian3 use. */
function propagateAll(timeMs: number) {
  const date = new Date(timeMs)
  const gmst = gstime(date)
  const data = new Float64Array(tracked.length * 4)
  let write = 0

  for (const item of tracked) {
    try {
      const result = propagate(item.satrec, date)
      if (!result) continue
      const position = result.position
      if (!position || typeof position === 'boolean') continue
      const ecf = eciToEcf(position, gmst)
      data[write++] = item.noradId
      data[write++] = ecf.x * 1000
      data[write++] = ecf.y * 1000
      data[write++] = ecf.z * 1000
    } catch {
      // Skip decayed / unpropagatable objects for this tick.
    }
  }

  // Transferable buffer keeps UI snappy under thousands of objects.
  const payload = data.subarray(0, write)
  const copy = payload.slice()
  post({
    type: 'positions',
    timeMs,
    data: copy,
  })
}

function start() {
  if (timer) return
  propagateAll(Date.now())
  timer = setInterval(() => propagateAll(Date.now()), intervalMs)
}

function stop() {
  if (!timer) return
  clearInterval(timer)
  timer = null
}

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data
  switch (msg.type) {
    case 'init': {
      tracked = []
      for (const obj of msg.objects) {
        try {
          tracked.push({
            noradId: obj.noradId,
            satrec: json2satrec(obj.omm),
          })
        } catch {
          // Skip bad element sets.
        }
      }
      post({ type: 'ready', count: tracked.length })
      break
    }
    case 'tick':
      propagateAll(msg.timeMs ?? Date.now())
      break
    case 'setIntervalMs':
      intervalMs = Math.max(100, msg.intervalMs)
      if (timer) {
        stop()
        start()
      }
      break
    case 'start':
      start()
      break
    case 'stop':
      stop()
      break
    default:
      break
  }
}
