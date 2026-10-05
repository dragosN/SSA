import { configureStore } from '@reduxjs/toolkit'
import catalogueReducer from '../features/catalogue/catalogueSlice'
import filtersReducer from '../features/filters/filtersSlice'
import viewerReducer from '../features/viewer/viewerSlice'
import healthReducer from '../features/health/healthSlice'

export const store = configureStore({
  reducer: {
    catalogue: catalogueReducer,
    filters: filtersReducer,
    viewer: viewerReducer,
    health: healthReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
