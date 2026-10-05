import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { OrbitRegime } from '../catalogue/types'

export type FiltersState = {
  regimes: OrbitRegime[]
  groups: string[]
  search: string
  showOrbits: boolean
}

const ALL_REGIMES: OrbitRegime[] = ['LEO', 'MEO', 'GEO', 'HEO', 'UNKNOWN']

const initialState: FiltersState = {
  regimes: [...ALL_REGIMES],
  groups: [],
  search: '',
  showOrbits: true,
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setRegimes(state, action: PayloadAction<OrbitRegime[]>) {
      state.regimes = action.payload
    },
    toggleRegime(state, action: PayloadAction<OrbitRegime>) {
      const regime = action.payload
      if (state.regimes.includes(regime)) {
        state.regimes = state.regimes.filter((r) => r !== regime)
      } else {
        state.regimes.push(regime)
      }
    },
    setGroups(state, action: PayloadAction<string[]>) {
      state.groups = action.payload
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload
    },
    setShowOrbits(state, action: PayloadAction<boolean>) {
      state.showOrbits = action.payload
    },
    resetFilters() {
      return initialState
    },
  },
})

export const {
  setRegimes,
  toggleRegime,
  setGroups,
  setSearch,
  setShowOrbits,
  resetFilters,
} = filtersSlice.actions

export { ALL_REGIMES }
export default filtersSlice.reducer
