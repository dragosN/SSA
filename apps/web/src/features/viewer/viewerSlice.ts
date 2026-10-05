import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type SceneModeKind = '3D' | '2D' | 'COLUMBUS'

export type ViewerState = {
  sceneMode: SceneModeKind
  selectedNoradId: number | null
}

const initialState: ViewerState = {
  sceneMode: '3D',
  selectedNoradId: null,
}

const viewerSlice = createSlice({
  name: 'viewer',
  initialState,
  reducers: {
    setSceneMode(state, action: PayloadAction<SceneModeKind>) {
      state.sceneMode = action.payload
    },
    selectObject(state, action: PayloadAction<number | null>) {
      state.selectedNoradId = action.payload
    },
  },
})

export const { setSceneMode, selectObject } = viewerSlice.actions
export default viewerSlice.reducer
