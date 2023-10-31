import { TableCell, TableHead, TableRow } from '@mui/material'

const TableHeader = () => {
	return (
		<TableHead>
			<TableRow>
				<TableCell align="center">Filename</TableCell>
				<TableCell align="center">Title</TableCell>
				<TableCell align="center">Artist</TableCell>
				<TableCell align="center">Album</TableCell>
				<TableCell align="center">Genre</TableCell>
				<TableCell align="center">BPM</TableCell>
				<TableCell align="center">Key</TableCell>
				<TableCell align="center">Database Actions</TableCell>
				<TableCell align="center">S3 Bucket Actions</TableCell>
			</TableRow>
		</TableHead>
	)
}

export default TableHeader
