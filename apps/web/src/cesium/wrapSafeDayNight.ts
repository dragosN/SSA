import {
  Cartesian2,
  Cartographic,
  EventHelper,
  Math as CesiumMath,
  PostProcessStage,
  SceneMode,
  type Viewer,
} from 'cesium'

/**
 * Wrap-safe day/night for 2D / Columbus infinite-scroll.
 *
 * Cesium's globe.enableLighting shades each projected map *copy* incorrectly across
 * the antimeridian restart — night appears to begin at the seam. This stage maps
 * screen UV → geographic lon/lat across the visible span so lighting is continuous.
 */
const WRAP_SAFE_DAY_NIGHT_FS = `
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform float u_enabled;
uniform float u_halfWidth;
uniform float u_nightBrightness;
uniform float u_west;
uniform float u_south;
uniform float u_east;
uniform float u_north;

in vec2 v_textureCoordinates;

vec3 geodeticUnit(float lon, float lat) {
  float cosLat = cos(lat);
  return vec3(cosLat * cos(lon), cosLat * sin(lon), sin(lat));
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);

  if (u_enabled < 0.5) {
    out_FragColor = color;
    return;
  }

  float width = u_east - u_west;
  if (width < 0.0) {
    width += czm_twoPi;
  }
  if (width < 1e-6) {
    width = czm_twoPi;
  }

  float lon = u_west + v_textureCoordinates.x * width;
  float lat = mix(u_south, u_north, v_textureCoordinates.y);
  float mu = dot(geodeticUnit(lon, lat), czm_sunDirectionWC);

  // Match Cesium day/night shading intensity (*5 + 0.3 ≈ dark night, bright day)
  // but with a wider smoothstep so the terminator isn't a hard wall.
  float dayFactor = smoothstep(-u_halfWidth, u_halfWidth, mu);
  float shade = mix(u_nightBrightness, 1.0, dayFactor);

  out_FragColor = vec4(color.rgb * shade, color.a);
}
`

export type WrapSafeDayNightHandle = {
  setEnabled: (enabled: boolean) => void
  destroy: () => void
}

export function installWrapSafeDayNight(viewer: Viewer): WrapSafeDayNightHandle {
  const stages = viewer.scene.postProcessStages
  for (let i = stages.length - 1; i >= 0; i--) {
    const existing = stages.get(i)
    if (existing?.name === 'ssa-wrap-safe-day-night') {
      stages.remove(existing)
    }
  }

  const scratchLeft = new Cartesian2()
  const scratchRight = new Cartesian2()
  const scratchBottom = new Cartesian2()
  const scratchTop = new Cartesian2()
  const scratchCarto = new Cartographic()

  const stage = new PostProcessStage({
    name: 'ssa-wrap-safe-day-night',
    fragmentShader: WRAP_SAFE_DAY_NIGHT_FS,
    uniforms: {
      u_enabled: 0.0,
      u_halfWidth: 0.2,
      // Cesium's built-in path uses roughly clamp(NdotL*5+0.3) → night floor ~0.3
      u_nightBrightness: 0.3,
      u_west: -Math.PI,
      u_south: -CesiumMath.PI_OVER_TWO,
      u_east: Math.PI,
      u_north: CesiumMath.PI_OVER_TWO,
    },
  })
  stages.add(stage)

  const helper = new EventHelper()
  helper.add(viewer.scene.preRender, () => {
    if (viewer.isDestroyed()) return
    if (stage.uniforms.u_enabled < 0.5) return

    const mode = viewer.scene.mode
    if (mode !== SceneMode.SCENE2D && mode !== SceneMode.COLUMBUS_VIEW) {
      return
    }

    const canvas = viewer.scene.canvas
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const ellipsoid = viewer.scene.globe.ellipsoid

    // Sample visible edges so infinite-scroll / IDL spans stay continuous in UV space.
    scratchLeft.x = 1
    scratchLeft.y = h * 0.5
    scratchRight.x = w - 1
    scratchRight.y = h * 0.5
    scratchBottom.x = w * 0.5
    scratchBottom.y = h - 1
    scratchTop.x = w * 0.5
    scratchTop.y = 1

    const left = viewer.camera.pickEllipsoid(scratchLeft, ellipsoid)
    const right = viewer.camera.pickEllipsoid(scratchRight, ellipsoid)
    const bottom = viewer.camera.pickEllipsoid(scratchBottom, ellipsoid)
    const top = viewer.camera.pickEllipsoid(scratchTop, ellipsoid)
    if (!left || !right || !bottom || !top) return

    const west = Cartographic.fromCartesian(left, ellipsoid, scratchCarto).longitude
    let east = Cartographic.fromCartesian(right, ellipsoid).longitude
    const south = Cartographic.fromCartesian(bottom, ellipsoid).latitude
    const north = Cartographic.fromCartesian(top, ellipsoid).latitude

    // Screen goes left→right; unwrapped longitude must increase. Cross-IDL ⇒ east < west.
    if (east < west) {
      east += CesiumMath.TWO_PI
    }

    // If the frustum is wider than one world, pickEllipsoid still returns [-π,π].
    // Expand using the 2D camera frustum width when available.
    const frustum = viewer.camera.frustum as { width?: number }
    if (typeof frustum.width === 'number' && frustum.width > 0) {
      const metersPerRadian = ellipsoid.maximumRadius
      const lonSpan = frustum.width / metersPerRadian
      if (lonSpan > east - west + 0.01) {
        east = west + lonSpan
      }
    }

    stage.uniforms.u_west = west
    stage.uniforms.u_east = east
    stage.uniforms.u_south = Math.min(south, north)
    stage.uniforms.u_north = Math.max(south, north)
  })

  return {
    setEnabled(enabled: boolean) {
      stage.uniforms.u_enabled = enabled ? 1.0 : 0.0
      // Avoid double-shading: Cesium lighting off while wrap-safe stage is on.
      if (!viewer.isDestroyed()) {
        viewer.scene.globe.enableLighting = !enabled
      }
    },
    destroy() {
      helper.removeAll()
      if (!viewer.isDestroyed()) {
        stages.remove(stage)
      }
    },
  }
}
