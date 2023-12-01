import { Container, CssBaseline, List, ThemeProvider, createTheme, useMediaQuery } from '@mui/material'
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
	const [failedFiles, setFailedFiles] = useState<string[]>([])

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
				<Upload setSongs={setSongs} setFailedFiles={setFailedFiles}/>
				<Database songs={songs} setSongs={setSongs} />
				{failedFiles.length > 0 && (
					<List
						style={{
							backgroundColor: theme.palette.error.main,
							color: theme.palette.error.contrastText,
							marginTop: theme.spacing(2),
							padding: theme.spacing(2),
						}}
					>
						{failedFiles.map((file) => (
							<li key={file}>{file}</li>
						))}
					</List>
				)}
			</Container>
		</ThemeProvider>
	)
}

export default App
