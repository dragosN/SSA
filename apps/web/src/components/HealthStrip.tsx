import { useEffect } from 'react'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { tickFeedAge } from '../features/health/healthSlice'
import { selectSelectedObject } from '../features/catalogue/selectors'

function formatAge(seconds: number | null): string {
  if (seconds == null) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function HealthStrip() {
  const dispatch = useAppDispatch()
  const health = useAppSelector((s) => s.health)
  const catalogueStatus = useAppSelector((s) => s.catalogue.status)
  const catalogueError = useAppSelector((s) => s.catalogue.error)
  const selected = useAppSelector(selectSelectedObject)

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!health.lastSuccessAt) {
        dispatch(tickFeedAge(null))
        return
      }
      const age = Math.floor(
        (Date.now() - new Date(health.lastSuccessAt).getTime()) / 1000,
      )
      dispatch(tickFeedAge(age))
    }, 1000)
    return () => window.clearInterval(id)
  }, [dispatch, health.lastSuccessAt])

  const statusColor =
    catalogueStatus === 'succeeded'
      ? 'success'
      : catalogueStatus === 'failed'
        ? 'error'
        : catalogueStatus === 'loading'
          ? 'warning'
          : 'default'

  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.75,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        <Chip size="small" label={health.source} color={statusColor} />
        <Typography variant="body2" color="text.secondary">
          Objects {health.objectCount.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Feed age {formatAge(health.feedAgeSeconds)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Failures {health.failureCount}
        </Typography>
        {catalogueError && (
          <Typography variant="body2" color="error.main">
            {catalogueError}
          </Typography>
        )}
        {selected && (
          <Typography variant="body2" sx={{ ml: 'auto' }}>
            Selected {selected.name} · NORAD {selected.noradId} · {selected.regime} ·{' '}
            {selected.group}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
