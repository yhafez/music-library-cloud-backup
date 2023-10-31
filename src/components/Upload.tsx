import { Box, Button, Typography, useTheme } from '@mui/material'
import axios, { AxiosError } from 'axios'
import { ChangeEvent, Dispatch, SetStateAction, useRef, useState } from 'react'

import type { Song } from '../../types'
import useSnackbar from '../hooks/useSnackbar'
import Snackbar from './Snackbar'

interface UploadProps {
	setSongs: Dispatch<SetStateAction<Song[]>>
}

const Upload = ({ setSongs }: UploadProps) => {
	const theme = useTheme()

	const { setMessage, setType, type, message } = useSnackbar()
	const [file, setFile] = useState<File | null>(null)
	const [loading, setLoading] = useState(false)

	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return console.error('No files selected')
		const selectedFile = e.target.files[0]
		setFile(selectedFile)
	}

	const handleUploadClick = async () => {
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const handleUploadConfirm = async () => {
		// Create a FormData object to send the file to the server
		const formData = new FormData()
		if (!file) return console.error('No file selected')
		formData.append('file', file)

		try {
			setLoading(true)

			// Upload the file to the server
			await axios.post('/api/songs/s3/upload', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})

			// Refresh the list of songs
			const response = await axios.get('/api/songs/db/list')
			setSongs(response.data)

			// Clear the selected file
			setFile(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}

			setType('success')
			setMessage('File uploaded successfully')
			setLoading(false)
		} catch (error) {
			console.error('Error uploading file:', error)

			if (error instanceof AxiosError) {
				if (error.response?.data?.error) {
					setType('error')
					setMessage(`Error uploading file: ${error.response.data.error}`)
				}
			} else {
				setType('error')
				setMessage('Error uploading file')
			}

			// Clear the selected file
			setFile(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}

			setLoading(false)
		}
	}

	const handleCancelClick = () => {
		// Clear the selected file and the file input field
		setFile(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	return (
		<Box
			sx={{
				backgroundColor:
					theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
				padding: '2rem',
				borderRadius: '1rem',
				marginTop: 4,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<input
				type="file"
				onChange={handleFileChange}
				ref={fileInputRef}
				style={{ display: 'none' }}
			/>
			<Typography variant="h4" component="h2" gutterBottom>
				Upload a song to your database
			</Typography>
			{file ? (
				<>
					{loading ? (
						<Typography
							variant="body1"
							component="p"
							sx={{
								color: theme.palette.primary.main,
								fontWeight: 'bold',
								my: '1rem',
							}}
						>
							Uploading...
						</Typography>
					) : (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								width: '100%',
								gap: '1rem',
								my: '1rem',
							}}
						>
							<Button variant="contained" onClick={handleUploadConfirm}>
								Confirm
							</Button>
							<Button variant="contained" color="error" onClick={handleCancelClick}>
								Cancel
							</Button>
						</Box>
					)}
					<Typography variant="body1" component="p">
						Selected file: {file.name}
					</Typography>
				</>
			) : (
				<>
					<Button
						variant="contained"
						onClick={handleUploadClick}
						sx={{
							my: '1rem',
							alignSelf: 'center',
						}}
					>
						Select File
					</Button>
					<Typography variant="body1" component="p">
						No file selected.
					</Typography>
				</>
			)}
			{message && (
				<Snackbar message={message} setMessage={setMessage} type={type} setType={setType} />
			)}
		</Box>
	)
}

export default Upload
