import { QueryResult } from 'pg'

import type { Song } from '../../../types'
import { query } from '../../db'
import handleDbError from './handleDbError'
import loadSqlQuery from '../../utils/loadSqlQuery'
import { getFileFromS3ById, handleS3Error } from '../s3'
import { AppError } from '../../middleware/error-handler'

const uploadFileFromS3ToDb = async (id: string): Promise<QueryResult<Song> | AppError> => {
	let fileStream
	try {
		fileStream = await getFileFromS3ById(id)
		if (fileStream instanceof AppError) return fileStream
	} catch (err) {
		return handleS3Error(err)
	}

	const metadata = fileStream.Metadata
	if (!metadata) {
		return handleS3Error(
			new AppError(`Failed to retrieve metadata for file with id ${id} from S3`, 500),
		)
	}

	try {
		const dbResult = await query(loadSqlQuery('insert-song-with-id.sql'), [
			metadata.filename,
			metadata,
			id,
		])
		if (dbResult?.rowCount !== 1)
			return handleDbError(new AppError(`Failed to save song with id ${id} to database`, 500))

		console.info(`Successfully saved song with id ${id} to database`)
		return dbResult
	} catch (err) {
		return handleDbError(new AppError(`Failed to save song with id ${id} to database`, 500, err))
	}
}

export default uploadFileFromS3ToDb
