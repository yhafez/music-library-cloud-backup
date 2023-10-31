import { Delete, Download, Edit } from '@mui/icons-material'
import { Box, IconButton, TableCell } from '@mui/material'
import { useState } from 'react'

import type { Song } from '../../../types'
import ConfirmDeleteModal from './ConfirmDeleteModal'

interface TableActionsProps {
	type: 'db' | 's3'
	songId: number
	setSongs: (songs: Song[]) => void
}

const TableActions = ({ type, songId, setSongs }: TableActionsProps) => {
	const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<number | null>(null)

	return (
		<TableCell align="center">
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-evenly',
				}}
			>
				{type === 's3' && (
					<IconButton aria-label="download" disabled>
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
			/>
		</TableCell>
	)
}

export default TableActions
