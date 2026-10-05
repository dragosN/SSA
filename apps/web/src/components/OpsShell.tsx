import { useEffect } from 'react'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { extendCatalogue, loadCatalogue } from '../features/catalogue/catalogueSlice'
import { FilterBar } from './FilterBar'
import { HealthStrip } from './HealthStrip'
import { OrbitalGlobe } from '../cesium/OrbitalGlobe'

export function OpsShell() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((s) => s.catalogue.status)
  const error = useAppSelector((s) => s.catalogue.error)
  const warning = useAppSelector((s) => s.catalogue.warning)
  const source = useAppSelector((s) => s.catalogue.source)

  useEffect(() => {
    void dispatch(loadCatalogue())
  }, [dispatch])

  // After the initial catalogue is up, pull the larger active set in the background.
  useEffect(() => {
    if (status !== 'succeeded') return
    if (source === 'fallback') return
    void dispatch(extendCatalogue())
  }, [dispatch, status, source])

  const showGlobe = status === 'succeeded'
  const showLoading = status === 'loading' || status === 'idle'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <FilterBar />
      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {showLoading && (
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              bgcolor: 'background.default',
            }}
          >
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading catalogue…</Typography>
          </Stack>
        )}

        {status === 'failed' && (
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              bgcolor: 'background.default',
              px: 2,
            }}
          >
            <Typography color="error.main" sx={{ textAlign: 'center' }}>
              {error ?? 'Failed to load catalogue'}
            </Typography>
            <Button variant="outlined" onClick={() => void dispatch(loadCatalogue())}>
              Retry
            </Button>
          </Stack>
        )}

        {showGlobe && (
          <>
            <OrbitalGlobe />
            {warning && (
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'rgba(20,24,30,0.85)',
                  border: 1,
                  borderColor: 'warning.main',
                  color: 'warning.light',
                  maxWidth: '90%',
                }}
              >
                {warning}
              </Typography>
            )}
          </>
        )}
      </Box>
      <HealthStrip />
    </Box>
  )
}
