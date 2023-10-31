import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	useTheme,
} from '@mui/material'
import axios, { AxiosError } from 'axios'

import { Song } from '../../../types'
import useSnackbar from '../../hooks/useSnackbar'
import SnackbarComponent from '../Snackbar'

interface ConfirmDeleteModalProps {
	type: 'db' | 's3'
	songId: number
	setSongs: (songs: Song[]) => void
	showConfirmDeleteModal: boolean
	setShowConfirmDeleteModal: (songId: number | null) => void
}

const ConfirmDeleteModal = ({
	type,
	songId,
	setSongs,
	showConfirmDeleteModal,
	setShowConfirmDeleteModal,
}: ConfirmDeleteModalProps) => {
	const theme = useTheme()
	const { setMessage, setType, type: messageType, message } = useSnackbar()

	const handleDelete = async () => {
		const url = `/api/songs/${type}/delete/${songId}`
		try {
			// Delete the song from the database
			await axios.delete(url)

			// Refresh the list of songs
			const response = await axios.get('/api/songs/db/list')
			setSongs(response.data)

			setType('success')
			setMessage(`Song deleted from database${type === 's3' ? ' and S3' : ''}`)
		} catch (error) {
			console.error(`Error deleting song from database${type === 's3' ? ' and S3' : ''}: ${error}`)
			if (error instanceof AxiosError && error.response?.status === 404) {
				setType('error')
				setMessage('Song not found in database')
				return
			}

			setType('error')
			setMessage(`Error deleting song from database${type === 's3' ? ' and S3' : ''}`)
		}
	}

	return (
		<>
			<Dialog
				open={showConfirmDeleteModal}
				onClose={() => setShowConfirmDeleteModal(null)}
				aria-labelledby={`confirm-${type}-delete-modal-title`}
				aria-describedby={`confirm-${type}-delete-modal-description`}
			>
				<DialogTitle
					id={`confirm-${type}-delete-modal-title`}
					sx={{
						backgroundColor: theme.palette.error.main,
						color: theme.palette.error.contrastText,
						mb: '1rem',
					}}
				>
					Confirm Database Delete
				</DialogTitle>
				<DialogContent>
					<DialogContentText id={`confirm-${type}-delete-modal-title`}>
						{`Are you sure you want to delete this song from ${
							type === 'db' ? 'the database' : 'S3'
						}?`}
					</DialogContentText>
					{type === 'db' && (
						<DialogContentText>This won&apos;t delete the file from S3.</DialogContentText>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDelete}>Delete</Button>
					<Button onClick={() => setShowConfirmDeleteModal(null)}>Cancel</Button>
				</DialogActions>
			</Dialog>
			{message && (
				<SnackbarComponent
					message={message}
					setMessage={setMessage}
					type={messageType}
					setType={setType}
				/>
			)}
		</>
	)
}

export default ConfirmDeleteModal
