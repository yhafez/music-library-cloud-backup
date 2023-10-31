import { Sync } from '@mui/icons-material'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'

import type { Song } from '../../../types'

interface HeaderProps {
	songs: Song[]
}

const Header = ({ songs }: HeaderProps) => {
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
						disabled
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
