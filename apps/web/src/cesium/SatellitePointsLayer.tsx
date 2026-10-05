import { useEffect, useMemo, useRef } from 'react'
import {
  Cartesian2,
  Cartesian3,
  Color,
  PointPrimitiveCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium'
import type { CatalogueObject } from '../features/catalogue/types'
import type { PositionMap } from '../hooks/usePropagation'

type Props = {
  viewer: Viewer | null
  objects: CatalogueObject[]
  positions: PositionMap
  selectedNoradId: number | null
  onSelect: (noradId: number | null) => void
}

const REGIME_COLOR: Record<string, Color> = {
  LEO: Color.fromCssColorString('#5b9fd4').withAlpha(0.9),
  MEO: Color.fromCssColorString('#4caf82').withAlpha(0.9),
  GEO: Color.fromCssColorString('#d4a017').withAlpha(0.95),
  HEO: Color.fromCssColorString('#c084fc').withAlpha(0.9),
  UNKNOWN: Color.fromCssColorString('#9aa7b5').withAlpha(0.7),
}

/**
 * Imperative PointPrimitiveCollection — far cheaper than one Entity per satellite.
 */
export function SatellitePointsLayer({
  viewer,
  objects,
  positions,
  selectedNoradId,
  onSelect,
}: Props) {
  const collectionRef = useRef<PointPrimitiveCollection | null>(null)
  const idByIndex = useRef<number[]>([])

  const objectById = useMemo(() => {
    const map = new Map<number, CatalogueObject>()
    for (const obj of objects) map.set(obj.noradId, obj)
    return map
  }, [objects])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    const collection = viewer.scene.primitives.add(new PointPrimitiveCollection())
    collectionRef.current = collection

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((movement: { position: Cartesian2 }) => {
      const picked = viewer.scene.pick(movement.position)
      if (picked && typeof picked.id === 'number') {
        onSelect(picked.id)
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      handler.destroy()
      if (!viewer.isDestroyed() && collectionRef.current) {
        viewer.scene.primitives.remove(collectionRef.current)
      }
      collectionRef.current = null
    }
  }, [viewer, onSelect])

  useEffect(() => {
    const collection = collectionRef.current
    if (!collection || collection.isDestroyed()) return

    collection.removeAll()
    idByIndex.current = []

    let index = 0
    for (const obj of objects) {
      const pos = positions.get(obj.noradId)
      if (!pos) continue

      const selected = obj.noradId === selectedNoradId
      collection.add({
        id: obj.noradId,
        position: new Cartesian3(pos.x, pos.y, pos.z),
        pixelSize: selected ? 10 : 4,
        color: selected
          ? Color.WHITE
          : (REGIME_COLOR[obj.regime] ?? REGIME_COLOR.UNKNOWN),
        outlineColor: Color.BLACK,
        outlineWidth: selected ? 1 : 0,
        // Depth-test against the globe so far-side objects are hidden.
      })
      idByIndex.current[index++] = obj.noradId
    }
  }, [objects, positions, selectedNoradId, objectById])

  return null
}
