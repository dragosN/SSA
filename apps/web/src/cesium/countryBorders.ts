import {
  ArcType,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  Entity,
  GeoJsonDataSource,
  PolygonHierarchy,
  PolylineGraphics,
  type Viewer,
} from 'cesium'

const BORDERS_URL = '/geo/ne_110m_admin_0_countries.geojson'
const DATA_SOURCE_NAME = 'ssa-country-borders'
const BORDER_COLOR = Color.fromCssColorString('#d7dee7').withAlpha(0.95)

function addRingAsPolyline(
  dataSource: GeoJsonDataSource,
  positions: PolygonHierarchy['positions'],
  name: string,
) {
  if (!positions || positions.length < 2) return

  dataSource.entities.add(
    new Entity({
      name,
      polyline: new PolylineGraphics({
        positions,
        width: new ConstantProperty(1.5),
        material: new ColorMaterialProperty(BORDER_COLOR),
        clampToGround: new ConstantProperty(false),
        arcType: new ConstantProperty(ArcType.GEODESIC),
        // No depthFailMaterial — otherwise far-side borders show through the globe.
      }),
    }),
  )
}

function hierarchyToPolylines(
  dataSource: GeoJsonDataSource,
  hierarchy: PolygonHierarchy,
  name: string,
) {
  addRingAsPolyline(dataSource, hierarchy.positions, name)
  const holes = hierarchy.holes
  if (!holes) return
  for (const hole of holes) {
    hierarchyToPolylines(dataSource, hole, name)
  }
}

/**
 * Natural Earth admin-0 country outlines as polylines.
 * Polygon outlineWidth is unreliable in WebGL — convert rings to polylines.
 */
export async function loadCountryBorders(viewer: Viewer): Promise<void> {
  const existing = viewer.dataSources.getByName(DATA_SOURCE_NAME)
  for (const ds of existing) {
    viewer.dataSources.remove(ds, true)
  }

  // Strip CRS (Cesium can reject GeoJSON with a CRS member).
  const response = await fetch(BORDERS_URL)
  if (!response.ok) {
    throw new Error(`Borders HTTP ${response.status}`)
  }
  const geojson = (await response.json()) as {
    crs?: unknown
    type: string
    features?: unknown
  }
  delete geojson.crs

  const loaded = await GeoJsonDataSource.load(geojson, {
    stroke: BORDER_COLOR,
    fill: Color.TRANSPARENT,
    strokeWidth: 1,
    clampToGround: false,
  })

  const borders = new GeoJsonDataSource(DATA_SOURCE_NAME)

  for (const entity of loaded.entities.values) {
    const name = entity.name ?? 'border'
    if (!entity.polygon?.hierarchy) continue

    const hierarchyValue = entity.polygon.hierarchy.getValue()
    if (!(hierarchyValue instanceof PolygonHierarchy)) continue
    hierarchyToPolylines(borders, hierarchyValue, name)
  }

  await viewer.dataSources.add(borders)
  loaded.entities.removeAll()
}
