import { useMemo } from 'react'
import { Color } from 'cesium'
import { Entity, PolylineGraphics } from 'resium'
import type { CatalogueObject } from '../features/catalogue/types'
import { sampleOrbitPath } from './orbitPath'

type Props = {
  object: CatalogueObject | null
  enabled: boolean
}

export function SelectedOrbit({ object, enabled }: Props) {
  const positions = useMemo(() => {
    if (!object || !enabled) return []
    try {
      return sampleOrbitPath(object.omm)
    } catch {
      return []
    }
  }, [object, enabled])

  if (!object || !enabled || positions.length < 2) return null

  return (
    <Entity name={`orbit-${object.noradId}`}>
      <PolylineGraphics
        positions={positions}
        width={2}
        material={Color.fromCssColorString('#5b9fd4').withAlpha(0.85)}
        clampToGround={false}
      />
    </Entity>
  )
}
