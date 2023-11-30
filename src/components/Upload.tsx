import { Box, Button, IconButton, List, Typography, useTheme } from '@mui/material'
import axios, { AxiosError } from 'axios'
import { ChangeEvent, Dispatch, SetStateAction, useRef, useState } from 'react'

import type { Song } from '../../types'
import useSnackbar from '../hooks/useSnackbar'
import Snackbar from './Snackbar'
import { Delete } from '@mui/icons-material'

interface UploadProps {
	setSongs: Dispatch<SetStateAction<Song[]>>
}

const Upload = ({ setSongs }: UploadProps) => {
	const theme = useTheme()

	const { setMessage, setType, type, message } = useSnackbar()
	const [files, setFiles] = useState<FileList | null>(null)
	const [loading, setLoading] = useState(false)

	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = e.target.files
		if (!selectedFiles || selectedFiles.length === 0) {
			setFiles(null) // Clear the files state when no files are selected
			return
		}

		const dataTransfer = new DataTransfer()

		const allowedFileTypes = ['audio/mpeg', 'audio/wav']
		const filteredFiles = Array.from(selectedFiles).filter(file =>
			allowedFileTypes.includes(file.type),
		)
		filteredFiles.forEach(f => dataTransfer.items.add(f))
		const fileList = dataTransfer.files
		setFiles(filteredFiles.length > 0 ? fileList : null)
		if (fileInputRef.current) fileInputRef.current.files = fileList
	}

	const handleUploadClick = async () => {
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const handleUploadConfirm = async () => {
		if (!files || files.length === 0) return console.error('No files selected')
		try {
			setLoading(true)
			const formData = new FormData()
			if (files.length === 1) {
				formData.append('file', files[0])
				await axios.post('/api/songs/s3/upload', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				})
			} else {
				for (let i = 0; i < files.length; i++) {
					formData.append('files', files[i])
				}
				await axios.post('/api/songs/s3/bulkupload', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				})
			}

			const response = await axios.get('/api/songs/db/list')
			setSongs(response.data)

			setFiles(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}

			setType('success')
			setMessage('Files uploaded successfully')
			setLoading(false)
		} catch (error) {
			console.error('Error uploading files:', error)

			if (error instanceof AxiosError) {
				if (error.response?.data?.error) {
					setType('error')
					setMessage(`Error uploading files: ${error.response.data.error}`)
				}
			} else {
				setType('error')
				setMessage('Error uploading files')
			}

			setFiles(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}

			setLoading(false)
		}
	}

	const handleCancelClick = () => {
		setFiles(null)
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
				multiple
				accept=".mp3, .wav"
			/>
			<Typography variant="h4" component="h2" gutterBottom>
				Upload songs to your database
			</Typography>
			{files !== null ? (
				<>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							width: '100%',
							gap: '1rem',
						}}
					>
						<Typography
							variant="body1"
							component="p"
							sx={{
								color: theme.palette.primary.main,
								fontWeight: 'bold',
								mt: '1rem',
								textAlign: 'center',
								fontSize: '1.2rem',
							}}
						>
							Selected files:
						</Typography>
						<List
							sx={{
								maxHeight: '10rem',
								overflowY: 'auto',
								overflowX: 'hidden',
								border: `1px solid ${theme.palette.primary.main}`,
								borderRadius: '0.5rem',
								padding: '0.5rem',
							}}
						>
							{Array.from(files).map(file => (
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem',
										borderBottom: `1px solid ${theme.palette.primary.main}`,
										'&:last-child': {
											borderBottom: 'none',
										},
									}}
									key={file.name}
								>
									<IconButton
										aria-label="delete"
										onClick={() => {
											const dataTransfer = new DataTransfer()
											const newFiles = Array.from(files).filter(f => f.name !== file.name)
											newFiles.forEach(f => dataTransfer.items.add(f))
											const fileList = dataTransfer.files
											setFiles(newFiles.length > 0 ? fileList : null)
											if (fileInputRef.current) fileInputRef.current.files = fileList
										}}
									>
										<Delete
											sx={{
												color: theme.palette.error.main,
											}}
											fontSize="small"
										/>
									</IconButton>
									<Typography
										variant="body1"
										component="p"
										sx={{
											fontSize: '0.9rem',
										}}
									>
										{file.name}
									</Typography>
								</Box>
							))}
						</List>
					</Box>
					{loading ? (
						<Typography
							variant="body1"
							component="p"
							sx={{
								color: theme.palette.primary.main,
								fontWeight: 'bold',
								mt: '1.5rem',
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
								mt: '1.5rem',
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
				</>
			) : (
				<>
					<Button
						variant="contained"
						onClick={handleUploadClick}
						sx={{
							mt: '1rem',
							alignSelf: 'center',
						}}
					>
						Select Files
					</Button>
				</>
			)}
			{message && (
				<Snackbar message={message} setMessage={setMessage} type={type} setType={setType} />
			)}
		</Box>
	)
}

export default Upload
