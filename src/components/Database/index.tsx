import { Box, Paper, Table, TableContainer, useTheme } from '@mui/material'
import axios, { AxiosError } from 'axios'
import { useEffect } from 'react'

import type { Song } from '../../../types'
import Header from './Header'
import Snackbar from '../Snackbar'
import TableBody from './TableBody'
import TableHeader from './TableHeader'
import useSnackbar from '../../hooks/useSnackbar'

interface DatabaseProps {
	songs: Song[]
	setSongs: (songs: Song[]) => void
}

const Database = ({ songs, setSongs }: DatabaseProps) => {
	const theme = useTheme()
	const { setMessage, setType, type: messageType, message } = useSnackbar()

	useEffect(() => {
		axios
			.get('/api/songs/db/list')
			.then(response => {
				setSongs(response.data)
			})
			.catch(error => {
				console.error('Error fetching songs:', error)

				if (error instanceof AxiosError && error.response?.status === 404) {
					setSongs([])
					setType('error')
					setMessage('No songs found')
					return
				}
				setSongs([])
				setType('error')
				setMessage('Error fetching songs')
			})
	}, [])

	return (
		<>
			<Box
				sx={{
					marginTop: 4,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					backgroundColor:
						theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
					padding: '2rem',
					borderRadius: '1rem',
				}}
			>
				<Header songs={songs} setSongs={setSongs} />
				{songs.length > 0 && (
					<TableContainer component={Paper}>
						<Table>
							<TableHeader />
							<TableBody
								songs={songs}
								setSongs={setSongs}
								setMessage={setMessage}
								setType={setType}
							/>
						</Table>
					</TableContainer>
				)}
			</Box>
			{message && (
				<Snackbar message={message} setMessage={setMessage} type={messageType} setType={setType} />
			)}
		</>
	)
}

export default Database
