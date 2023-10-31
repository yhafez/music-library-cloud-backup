import { Sync } from '@mui/icons-material'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'

import axios from 'axios'
import type { Song } from '../../../types'
import useSnackbar from '../../hooks/useSnackbar'

interface HeaderProps {
	songs: Song[]
	setSongs: (songs: Song[]) => void
}

const Header = ({ songs, setSongs }: HeaderProps) => {
	const { setMessage, setType } = useSnackbar()

	const handleSync = async () => {
		try {
			const syncResult = await axios.get('/api/songs/db/sync')
			if (syncResult.status === 200) {
				const listResult = await axios.get('/api/songs/db/list')
				if (listResult.status === 200) {
					setSongs(listResult.data)
					setType('success')
					setMessage('Database synced with S3 bucket')
				} else {
					setType('error')
					setMessage('Error fetching songs')
				}
			}
		} catch (err) {
			console.error('Error syncing songs:', err)
			setType('error')
			setMessage('Error syncing songs')
		}
	}

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: '0.5rem',
					width: '100%',
					marginBottom: '1rem',
				}}
			>
				<Tooltip title="Sync database with S3 bucket">
					<IconButton
						aria-label="sync database with S3 bucket"
						onClick={handleSync}
						sx={{
							'&:hover': {
								color: 'primary.main',
							},
						}}
					>
						<Sync />
					</IconButton>
				</Tooltip>
				<Typography variant="h5" component="h2" gutterBottom>
					My Songs
				</Typography>
			</Box>
			{songs.length > 0 ? (
				<Typography variant="body1" component="p" style={{ marginBottom: '1rem' }}>
					{songs.length} songs found.
				</Typography>
			) : (
				<Typography variant="body1" component="p">
					No songs found.
				</Typography>
			)}
		</>
	)
}

export default Header
