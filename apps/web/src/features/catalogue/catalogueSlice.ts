import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  CELESTRAK_GROUPS_EXTENDED,
  CELESTRAK_GROUPS_INITIAL,
  fetchCelesTrakCatalogue,
} from './celestrak'
import type { CatalogueObject } from './types'

export type CatalogueState = {
  objects: CatalogueObject[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  warning: string | null
  source: 'celestrak' | 'bundled' | 'mirror' | 'fallback' | null
  loadedAt: string | null
  extending: boolean
}

const initialState: CatalogueState = {
  objects: [],
  status: 'idle',
  error: null,
  warning: null,
  source: null,
  loadedAt: null,
  extending: false,
}

export const loadCatalogue = createAsyncThunk(
  'catalogue/load',
  async () =>
    fetchCelesTrakCatalogue(CELESTRAK_GROUPS_INITIAL.map((g) => g.id)),
)

export const extendCatalogue = createAsyncThunk(
  'catalogue/extend',
  async () =>
    fetchCelesTrakCatalogue(CELESTRAK_GROUPS_EXTENDED.map((g) => g.id)),
)

const catalogueSlice = createSlice({
  name: 'catalogue',
  initialState,
  reducers: {
    clearCatalogue(state) {
      state.objects = []
      state.status = 'idle'
      state.error = null
      state.warning = null
      state.source = null
      state.loadedAt = null
      state.extending = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCatalogue.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.warning = null
      })
      .addCase(loadCatalogue.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.objects = action.payload.objects
        state.source = action.payload.source
        state.warning = action.payload.warning ?? null
        state.loadedAt = new Date().toISOString()
      })
      .addCase(loadCatalogue.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message ?? 'Failed to load catalogue'
      })
      .addCase(extendCatalogue.pending, (state) => {
        state.extending = true
      })
      .addCase(extendCatalogue.fulfilled, (state, action) => {
        state.extending = false
        if (
          action.payload.source !== 'celestrak' &&
          action.payload.source !== 'bundled' &&
          action.payload.source !== 'mirror'
        ) {
          return
        }
        const byId = new Map<number, CatalogueObject>()
        for (const obj of state.objects) byId.set(obj.noradId, obj)
        for (const obj of action.payload.objects) {
          if (!byId.has(obj.noradId)) byId.set(obj.noradId, obj)
        }
        state.objects = [...byId.values()]
        state.loadedAt = new Date().toISOString()
        if (action.payload.warning) {
          state.warning = action.payload.warning
        }
      })
      .addCase(extendCatalogue.rejected, (state) => {
        state.extending = false
      })
  },
})

export const { clearCatalogue } = catalogueSlice.actions
export default catalogueSlice.reducer
