import { Container, createTheme, useMediaQuery } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { useMemo, useState } from 'react'

import { Song } from '../types'
import Database from './components/Database'
import Header from './components/Header'
import Navbar from './components/Navbar'
import Upload from './components/Upload'

function App() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
	const [darkMode, setDarkMode] = useState<boolean>(prefersDarkMode)
	const [songs, setSongs] = useState<Song[]>([])

	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode: darkMode ? 'dark' : 'light',
				},
			}),
		[darkMode],
	)

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline enableColorScheme />
			<Container component="main" maxWidth="md">
				<Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
				<Header />
				<Upload setSongs={setSongs} />
				<Database songs={songs} setSongs={setSongs} />
			</Container>
		</ThemeProvider>
	)
}

export default App
