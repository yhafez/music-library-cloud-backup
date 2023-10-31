import axios from 'axios'
import { ChangeEvent, useEffect, useRef, useState } from 'react'

export interface Song {
	id: number
	filename: string
	metadata: any
}

function App() {
	const [songs, setSongs] = useState<Song[]>([])
	const [file, setFile] = useState<File | null>(null)
	const [fetchError, setFetchError] = useState<string | null>(null)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const fileInputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		// Fetch the list of songs from your API on component mount
		axios
			.get('/api/songs/db/list')
			.then(response => {
				setFetchError(null)
				setSongs(response.data)
			})
			.catch(error => {
				console.error('Error fetching songs:', error)
				setFetchError('Error fetching songs')
			})
	}, [])

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return console.error('No files selected')
		const selectedFile = e.target.files[0]
		setFile(selectedFile)
	}

	const handleUpload = async () => {
		if (!file) {
			// Trigger file input click event to allow user to select a file
			if (fileInputRef.current) {
				fileInputRef.current.click()
			}
		}

		// Create a FormData object to send the file to the server
		const formData = new FormData()
		if (!file) return console.error('No file selected')
		formData.append('file', file)

		try {
			setUploadError(null)

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
		} catch (error) {
			console.error('Error uploading file:', error)
			setUploadError('Error uploading file')
		}
	}

	return (
		<div
			className="App"
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '1rem',
			}}
		>
			<h1
				style={{
					marginBottom: '1rem',
				}}
			>
				Music Library Cloud Backup
			</h1>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '1rem',
				}}
			>
				<input
					type="file"
					onChange={handleFileChange}
					ref={fileInputRef}
					style={{ display: 'none' }}
				/>
				<button
					style={{
						padding: '0.5rem 1rem',
						marginBottom: '1rem',
					}}
					onClick={handleUpload}
				>
					Upload
				</button>
				{uploadError && (
					<p
						style={{
							color: 'red',
						}}
					>
						{uploadError}
					</p>
				)}
			</div>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '1rem',
				}}
			>
				<h2
					style={{
						marginBottom: '1rem',
					}}
				>
					My Songs
				</h2>
				{fetchError ? (
					<p
						style={{
							color: 'red',
						}}
					>
						{fetchError}
					</p>
				) : songs.length > 0 ? (
					<p
						style={{
							marginBottom: '1rem',
						}}
					>
						{songs.length} songs found.
					</p>
				) : (
					<p>No songs found.</p>
				)}
				<ul
					style={{
						padding: '0',
					}}
				>
					{songs.map(song => (
						<li style={{ listStyleType: 'none' }} key={song.id}>
							{song.filename}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

export default App
