import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildModuleUrl,
  Color,
  Ion,
  MapMode2D,
  TileMapServiceImageryProvider,
  UrlTemplateImageryProvider,
  type Viewer as CesiumViewer,
} from 'cesium'
import { Viewer } from 'resium'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectObject } from '../features/viewer/viewerSlice'
import {
  selectFilteredObjects,
  selectSelectedObject,
} from '../features/catalogue/selectors'
import { usePropagation } from '../hooks/usePropagation'
import { SatellitePointsLayer } from './SatellitePointsLayer'
import { SelectedOrbit } from './SelectedOrbit'
import {
  installWrapSafeDayNight,
  type WrapSafeDayNightHandle,
} from './wrapSafeDayNight'
import { loadCountryBorders } from './countryBorders'

// Optional — only needed for Cesium ion assets.
// Default basemap is Esri World Imagery (no ion token); NaturalEarthII is the offline fallback.
const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined
if (ionToken) {
  Ion.defaultAccessToken = ionToken
}

function morphToMode(
  viewer: CesiumViewer,
  kind: '3D' | '2D' | 'COLUMBUS',
) {
  if (kind === '2D') {
    viewer.scene.morphTo2D(0)
  } else if (kind === 'COLUMBUS') {
    viewer.scene.morphToColumbusView(0)
  } else {
    viewer.scene.morphTo3D(0)
  }
}

/** High-res tiles for clear zoom; falls back to bundled NaturalEarthII offline. */
async function loadControlRoomImagery(viewer: CesiumViewer) {
  viewer.imageryLayers.removeAll()

  try {
    const hiRes = new UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 19,
      credit: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
    })
    viewer.imageryLayers.addImageryProvider(hiRes)
    return
  } catch (err) {
    console.warn('Hi-res basemap failed, falling back to NaturalEarthII', err)
  }

  const fallback = await TileMapServiceImageryProvider.fromUrl(
    buildModuleUrl('Assets/Textures/NaturalEarthII'),
  )
  viewer.imageryLayers.addImageryProvider(fallback)
}

function applyControlRoomLook(
  viewer: CesiumViewer,
  dayNight: WrapSafeDayNightHandle,
) {
  viewer.scene.globe.baseColor = Color.fromCssColorString('#0b0e12')
  viewer.scene.backgroundColor = Color.fromCssColorString('#05070a')
  viewer.scene.globe.showGroundAtmosphere = true
  viewer.scene.globe.dynamicAtmosphereLighting = true
  viewer.scene.globe.dynamicAtmosphereLightingFromSun = true
  // Occlude satellites / borders behind the Earth.
  viewer.scene.globe.depthTestAgainstTerrain = true
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = true
  }

  // Start in 3D defaults; scene-mode effect switches lighting strategy.
  viewer.scene.globe.enableLighting = true
  dayNight.setEnabled(false)

  void loadControlRoomImagery(viewer).catch((err) => {
    console.error('Failed to load basemap', err)
  })
  void loadCountryBorders(viewer).catch((err) => {
    console.error('Failed to load country borders', err)
  })
}

export function OrbitalGlobe() {
  const dispatch = useAppDispatch()
  const filtered = useAppSelector(selectFilteredObjects)
  const selected = useAppSelector(selectSelectedObject)
  const selectedNoradId = useAppSelector((s) => s.viewer.selectedNoradId)
  const sceneMode = useAppSelector((s) => s.viewer.sceneMode)
  const showOrbits = useAppSelector((s) => s.filters.showOrbits)

  const { positions } = usePropagation(filtered)
  const viewerRef = useRef<CesiumViewer | null>(null)
  const dayNightRef = useRef<WrapSafeDayNightHandle | null>(null)
  const [viewer, setViewer] = useState<CesiumViewer | null>(null)

  const onSelect = useCallback(
    (noradId: number | null) => {
      dispatch(selectObject(noradId))
    },
    [dispatch],
  )

  const onViewerReady = useCallback((cesium: CesiumViewer) => {
    if (viewerRef.current === cesium || cesium.isDestroyed()) return
    viewerRef.current = cesium
    dayNightRef.current?.destroy()
    dayNightRef.current = installWrapSafeDayNight(cesium)
    applyControlRoomLook(cesium, dayNightRef.current)
    setViewer(cesium)
  }, [])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return
    morphToMode(viewer, sceneMode)

    // Cesium enableLighting breaks across infinite-scroll map copies in 2D.
    // Use wrap-safe geographic shading there; keep Cesium default lighting in 3D.
    const useWrapSafe = sceneMode === '2D' || sceneMode === 'COLUMBUS'
    dayNightRef.current?.setEnabled(useWrapSafe)
  }, [sceneMode, viewer])

  useEffect(() => {
    return () => {
      dayNightRef.current?.destroy()
      dayNightRef.current = null
    }
  }, [])

  return (
    <Viewer
      full
      ref={(ref) => {
        const cesium = ref?.cesiumElement ?? null
        if (cesium) onViewerReady(cesium)
      }}
      timeline={false}
      animation={false}
      baseLayerPicker={false}
      geocoder={false}
      homeButton={false}
      sceneModePicker={false}
      navigationHelpButton={false}
      fullscreenButton={false}
      infoBox={false}
      selectionIndicator={false}
      baseLayer={false}
      terrain={undefined}
      mapMode2D={MapMode2D.INFINITE_SCROLL}
      style={{ width: '100%', height: '100%' }}
    >
      <SatellitePointsLayer
        viewer={viewer}
        objects={filtered}
        positions={positions}
        selectedNoradId={selectedNoradId}
        onSelect={onSelect}
      />
      <SelectedOrbit object={selected} enabled={showOrbits} />
    </Viewer>
  )
}
