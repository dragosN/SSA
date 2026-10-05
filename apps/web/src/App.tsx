import { CssBaseline, ThemeProvider } from '@mui/material'
import { Provider } from 'react-redux'
import { store } from './store'
import { controlRoomTheme } from './theme/controlRoomTheme'
import { OpsShell } from './components/OpsShell'

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={controlRoomTheme}>
        <CssBaseline />
        <OpsShell />
      </ThemeProvider>
    </Provider>
  )
}
