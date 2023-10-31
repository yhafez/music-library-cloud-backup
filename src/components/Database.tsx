import DeleteIcon from '@mui/icons-material/Delete'
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useTheme,
} from '@mui/material'
import axios, { AxiosError } from 'axios'
import { useEffect, useState } from 'react'

import type { Song } from '../../types'
import useSnackbar from '../hooks/useSnackbar'
import Snackbar from './Snackbar'

interface DatabaseProps {
	songs: Song[]
	setSongs: (songs: Song[]) => void
}

const Database = ({ songs, setSongs }: DatabaseProps) => {
	const theme = useTheme()
	const { setMessage, setType, type, message } = useSnackbar()

	const [showDBDeleteModal, setShowDBDeleteModal] = useState<number | null>(null)
	const [fetchError, setFetchError] = useState<string | null>(null)

	useEffect(() => {
		axios
			.get('/api/songs/db/list')
			.then(response => {
				setFetchError(null)
				setSongs(response.data)
			})
			.catch(error => {
				console.error('Error fetching songs:', error)

				if (error instanceof AxiosError && error.response?.status === 404) {
					setFetchError('No songs found')
					return
				}
				setFetchError('Error fetching songs')
			})
	}, [])

	const handleDBDelete = async (songId: number) => {
		try {
			// Delete the song from the database
			await axios.delete(`/api/songs/db/delete/${songId}`)
			// Refresh the list of songs
			const response = await axios.get('/api/songs/db/list')
			setSongs(response.data)

			setType('success')
			setMessage('Song deleted from database')
		} catch (error) {
			console.error('Error deleting song from database:', error)
			if (error instanceof AxiosError && error.response?.status === 404) {
				setType('error')
				setMessage('Song not found in database')
				return
			}

			setType('error')
			setMessage('Error deleting song from database')
		}
	}

	return (
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
			<Typography variant="h5" component="h2" gutterBottom>
				My Songs
			</Typography>
			{fetchError ? (
				<Typography variant="body1" component="p" style={{ color: 'red' }}>
					{fetchError}
				</Typography>
			) : songs.length > 0 ? (
				<Typography variant="body1" component="p" style={{ marginBottom: '1rem' }}>
					{songs.length} songs found.
				</Typography>
			) : (
				<Typography variant="body1" component="p">
					No songs found.
				</Typography>
			)}
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell align="center">Filename</TableCell>
							<TableCell>Title</TableCell>
							<TableCell>Artist</TableCell>
							<TableCell>Album</TableCell>
							<TableCell>Genre</TableCell>
							<TableCell>BPM</TableCell>
							<TableCell>Key</TableCell>
							<TableCell align="center">Database Actions</TableCell>
							<TableCell align="center">S3 Bucket Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{songs.map(song => (
							<TableRow key={song.id}>
								<TableCell align="center">{song.filename}</TableCell>
								<TableCell>{song.metadata.title}</TableCell>
								<TableCell>{song.metadata.artist}</TableCell>
								<TableCell>{song.metadata.album}</TableCell>
								<TableCell>{song.metadata.genre.join(', ')}</TableCell>
								<TableCell>{song.metadata.bpm}</TableCell>
								<TableCell>{song.metadata.key}</TableCell>
								<TableCell align="center">
									<Button
										variant="contained"
										color="error"
										startIcon={<DeleteIcon />}
										onClick={() => setShowDBDeleteModal(song.id)}
									>
										Delete
									</Button>
									<Dialog
										open={showDBDeleteModal === song.id}
										onClose={() => setShowDBDeleteModal(null)}
										aria-labelledby="confirm-database-delete-modal-title"
										aria-describedby="confirm-database-delete-modal-description"
									>
										<DialogTitle
											id="confirm-database-delete-modal-title"
											sx={{
												backgroundColor: theme.palette.error.main,
												color: theme.palette.error.contrastText,
												mb: '1rem',
											}}
										>
											Confirm Database Delete
										</DialogTitle>
										<DialogContent>
											<DialogContentText id="confirm-database-delete-modal-description">
												Are you sure you want to delete this song from the database?
											</DialogContentText>
											<DialogContentText>
												This won&apos;t delete the file from S3.
											</DialogContentText>
										</DialogContent>
										<DialogActions>
											<Button onClick={() => handleDBDelete(song.id)}>Delete</Button>
											<Button onClick={() => setShowDBDeleteModal(null)}>Cancel</Button>
										</DialogActions>
									</Dialog>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			{message && (
				<Snackbar message={message} setMessage={setMessage} type={type} setType={setType} />
			)}
		</Box>
	)
}

export default Database
