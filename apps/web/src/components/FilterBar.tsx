import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  FormControlLabel,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  ALL_REGIMES,
  setGroups,
  setSearch,
  setShowOrbits,
  toggleRegime,
} from '../features/filters/filtersSlice'
import { setSceneMode, type SceneModeKind } from '../features/viewer/viewerSlice'
import { selectAvailableGroups } from '../features/catalogue/selectors'
import type { OrbitRegime } from '../features/catalogue/types'
import { CELESTRAK_GROUPS } from '../features/catalogue/celestrak'

const GROUP_LABELS = Object.fromEntries(
  CELESTRAK_GROUPS.map((g) => [g.id, g.label]),
)

export function FilterBar() {
  const dispatch = useAppDispatch()
  const regimes = useAppSelector((s) => s.filters.regimes)
  const groups = useAppSelector((s) => s.filters.groups)
  const search = useAppSelector((s) => s.filters.search)
  const showOrbits = useAppSelector((s) => s.filters.showOrbits)
  const sceneMode = useAppSelector((s) => s.viewer.sceneMode)
  const availableGroups = useAppSelector(selectAvailableGroups)
  const filteredCount = useAppSelector(
    (s) =>
      s.catalogue.objects.filter((o) => {
        if (!regimes.includes(o.regime)) return false
        if (groups.length > 0 && !groups.includes(o.group)) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return o.name.toLowerCase().includes(q) || String(o.noradId).includes(q)
      }).length,
  )

  const onGroupsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    dispatch(setGroups(typeof value === 'string' ? value.split(',') : value))
  }

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        <Typography variant="h6" sx={{ mr: 1, whiteSpace: 'nowrap' }}>
          SSA Ops
        </Typography>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={sceneMode}
          onChange={(_, value: SceneModeKind | null) => {
            if (value) dispatch(setSceneMode(value))
          }}
        >
          <ToggleButton value="3D">3D</ToggleButton>
          <ToggleButton value="2D">2D</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={0.5}>
          {ALL_REGIMES.filter((r) => r !== 'UNKNOWN').map((regime) => (
            <Chip
              key={regime}
              label={regime}
              size="small"
              color={regimes.includes(regime) ? 'primary' : 'default'}
              variant={regimes.includes(regime) ? 'filled' : 'outlined'}
              onClick={() => dispatch(toggleRegime(regime as OrbitRegime))}
            />
          ))}
        </Stack>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="group-filter-label">Group</InputLabel>
          <Select
            labelId="group-filter-label"
            multiple
            value={groups}
            onChange={onGroupsChange}
            input={<OutlinedInput label="Group" />}
            renderValue={(selected) =>
              selected.map((id) => GROUP_LABELS[id] ?? id).join(', ')
            }
          >
            {availableGroups.map((id) => (
              <MenuItem key={id} value={id}>
                {GROUP_LABELS[id] ?? id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Search"
          placeholder="Name or NORAD"
          value={search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
          sx={{ width: 180 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={showOrbits}
              onChange={(_, checked) => dispatch(setShowOrbits(checked))}
              size="small"
            />
          }
          label="Orbit path"
        />

        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filteredCount.toLocaleString()} objects
        </Typography>
      </Stack>
    </Box>
  )
}
