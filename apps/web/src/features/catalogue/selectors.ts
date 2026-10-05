import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import type { CatalogueObject } from './types'

const selectObjects = (state: RootState) => state.catalogue.objects
const selectRegimes = (state: RootState) => state.filters.regimes
const selectGroups = (state: RootState) => state.filters.groups
const selectSearch = (state: RootState) => state.filters.search

export const selectFilteredObjects = createSelector(
  [selectObjects, selectRegimes, selectGroups, selectSearch],
  (objects, regimes, groups, search): CatalogueObject[] => {
    const q = search.trim().toLowerCase()
    return objects.filter((obj) => {
      if (!regimes.includes(obj.regime)) return false
      if (groups.length > 0 && !groups.includes(obj.group)) return false
      if (!q) return true
      return (
        obj.name.toLowerCase().includes(q) ||
        String(obj.noradId).includes(q)
      )
    })
  },
)

export const selectAvailableGroups = createSelector(
  [selectObjects],
  (objects) => {
    const set = new Set<string>()
    for (const obj of objects) set.add(obj.group)
    return [...set].sort()
  },
)

export const selectSelectedObject = createSelector(
  [selectObjects, (s: RootState) => s.viewer.selectedNoradId],
  (objects, selectedNoradId) =>
    selectedNoradId == null
      ? null
      : (objects.find((o) => o.noradId === selectedNoradId) ?? null),
)
