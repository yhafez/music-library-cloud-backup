import { TableBody, TableCell, TableRow } from '@mui/material'

import type { Song } from '../../../types'
import TableActions from './TableActions'

interface TableBodyProps {
	songs: Song[]
	setSongs: (songs: Song[]) => void
}

const TableBodyComponent = ({ songs, setSongs }: TableBodyProps) => {
	return (
		<TableBody>
			{songs.map(song => (
				<TableRow key={song.id}>
					<TableCell align="center">{song.filename}</TableCell>
					<TableCell align="center">{song.metadata.title}</TableCell>
					<TableCell align="center">{song.metadata.artist}</TableCell>
					<TableCell align="center">{song.metadata.album}</TableCell>
					<TableCell align="center">{song.metadata.genre}</TableCell>
					<TableCell align="center">{song.metadata.bpm}</TableCell>
					<TableCell align="center">{song.metadata.key}</TableCell>
					<TableActions type="db" songId={song.id} setSongs={setSongs} />
					<TableActions type="s3" songId={song.id} setSongs={setSongs} />
				</TableRow>
			))}
		</TableBody>
	)
}

export default TableBodyComponent
