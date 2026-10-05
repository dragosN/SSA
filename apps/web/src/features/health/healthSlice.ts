import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { extendCatalogue, loadCatalogue } from '../catalogue/catalogueSlice'

export type HealthState = {
  source: string
  lastSuccessAt: string | null
  lastFailureAt: string | null
  failureCount: number
  objectCount: number
  feedAgeSeconds: number | null
}

const initialState: HealthState = {
  source: 'CelesTrak GP',
  lastSuccessAt: null,
  lastFailureAt: null,
  failureCount: 0,
  objectCount: 0,
  feedAgeSeconds: null,
}

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    tickFeedAge(state, action: PayloadAction<number | null>) {
      state.feedAgeSeconds = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCatalogue.fulfilled, (state, action) => {
        state.lastSuccessAt = new Date().toISOString()
        state.objectCount = action.payload.objects.length
        state.feedAgeSeconds = 0
        state.source =
          action.payload.source === 'fallback'
            ? 'Offline sample'
            : action.payload.source === 'bundled'
              ? 'Bundled catalogue'
              : action.payload.source === 'mirror'
                ? 'GitHub mirror'
                : 'CelesTrak GP'
      })
      .addCase(loadCatalogue.rejected, (state) => {
        state.lastFailureAt = new Date().toISOString()
        state.failureCount += 1
      })
      .addCase(extendCatalogue.fulfilled, (state, action) => {
        if (
          action.payload.source !== 'celestrak' &&
          action.payload.source !== 'bundled' &&
          action.payload.source !== 'mirror'
        ) {
          return
        }
        state.objectCount = Math.max(
          state.objectCount,
          action.payload.objects.length,
        )
        state.lastSuccessAt = new Date().toISOString()
        state.feedAgeSeconds = 0
      })
  },
})

export const { tickFeedAge } = healthSlice.actions
export default healthSlice.reducer
