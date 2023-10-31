import { Container, CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material'
import { useMemo, useState } from 'react'

import type { Song } from '../types'
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
			<Container component="main">
				<Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
				<Header />
				<Upload setSongs={setSongs} />
				<Database songs={songs} setSongs={setSongs} />
			</Container>
		</ThemeProvider>
	)
}

export default App
