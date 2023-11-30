import { Delete, Download, Edit } from '@mui/icons-material'
import { Box, IconButton, TableCell } from '@mui/material'
import axios from 'axios'
import { useState } from 'react'

import type { Song } from '../../../types'
import ConfirmDeleteModal from './ConfirmDeleteModal'

interface TableActionsProps {
	type: 'db' | 's3'
	songId: number
	setSongs: (songs: Song[]) => void
	setMessage: (message: string) => void
	setType: (type: 'success' | 'error' | 'info' | 'warning' | null) => void
}

const TableActions = ({ type, songId, setSongs, setMessage, setType }: TableActionsProps) => {
	const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<number | null>(null)

	const handleDownload = async () => {
		try {
			const res = await axios.get(`/api/songs/s3/download/${songId}`, {
				responseType: 'blob',
			})

			if (res.status !== 200) {
				throw new Error(`Failed to download song. Status: ${res.status}`)
			}

			// Extract the filename from the response headers
			const contentDisposition = res.headers['content-disposition']
			const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
			const filename = matches && matches.length > 1 ? matches[1] : `song-${songId}.mp3`

			// Create a URL for the blob and trigger a download
			const blobUrl = window.URL.createObjectURL(res.data)
			const a = document.createElement('a')
			a.href = blobUrl
			a.download = filename
			a.style.display = 'none'
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(blobUrl)

			setType('success')
			setMessage('Song downloaded')
		} catch (error) {
			setType('error')
			setMessage('Error downloading song')
		}
	}

	return (
		<>
			<TableCell align="center">
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-evenly',
					}}
				>
					{type === 's3' && (
						<IconButton aria-label="download" onClick={handleDownload}>
							<Download />
						</IconButton>
					)}
					<IconButton aria-label="edit" disabled>
						<Edit />
					</IconButton>
					<IconButton aria-label="delete" onClick={() => setShowConfirmDeleteModal(songId)}>
						<Delete />
					</IconButton>
				</Box>
				<ConfirmDeleteModal
					type={type}
					songId={songId}
					setSongs={setSongs}
					showConfirmDeleteModal={showConfirmDeleteModal === songId}
					setShowConfirmDeleteModal={setShowConfirmDeleteModal}
					setMessage={setMessage}
					setType={setType}
				/>
			</TableCell>
		</>
	)
}

export default TableActions
