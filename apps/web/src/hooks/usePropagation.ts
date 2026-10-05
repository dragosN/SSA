import { useEffect, useRef, useState } from 'react'
import type { CatalogueObject } from '../features/catalogue/types'
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
} from '../workers/propagateProtocol'

export type PositionMap = Map<number, { x: number; y: number; z: number }>

/**
 * Owns the SGP4 Web Worker lifecycle and exposes the latest ECI positions (km).
 */
export function usePropagation(objects: CatalogueObject[]) {
  const workerRef = useRef<Worker | null>(null)
  const [positions, setPositions] = useState<PositionMap>(() => new Map())
  const [readyCount, setReadyCount] = useState(0)
  const [workerError, setWorkerError] = useState<string | null>(null)

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/propagate.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        setReadyCount(msg.count)
        setWorkerError(null)
        return
      }
      if (msg.type === 'error') {
        setWorkerError(msg.message)
        return
      }
      if (msg.type === 'positions') {
        const next: PositionMap = new Map()
        const { data } = msg
        for (let i = 0; i + 3 < data.length; i += 4) {
          next.set(data[i]!, {
            x: data[i + 1]!,
            y: data[i + 2]!,
            z: data[i + 3]!,
          })
        }
        setPositions(next)
      }
    }

    worker.onerror = (err) => {
      setWorkerError(err.message || 'Propagation worker failed')
    }

    return () => {
      worker.postMessage({ type: 'stop' } satisfies MainToWorkerMessage)
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const worker = workerRef.current
    if (!worker || objects.length === 0) return

    const payload: MainToWorkerMessage = {
      type: 'init',
      objects: objects.map((o) => ({ noradId: o.noradId, omm: o.omm })),
    }
    worker.postMessage(payload)
    worker.postMessage({ type: 'start' } satisfies MainToWorkerMessage)
  }, [objects])

  return { positions, readyCount, workerError }
}
