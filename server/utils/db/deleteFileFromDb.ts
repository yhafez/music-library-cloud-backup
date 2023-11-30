import { QueryResult } from 'pg'

import type { Song } from '../../../types'
import { query } from '../../db'
import { getFileById } from '../getFile'
import loadSqlQuery from '../loadSqlQuery'
import handleDbError from './handleDbError'
import { AppError } from '../../middleware/error-handler'

const deleteFileFromDb = async (id: string): Promise<QueryResult<Song> | AppError> => {
	// Check if file exists
	const fileDoesNotExistError = await getFileById(id)
	if (fileDoesNotExistError instanceof AppError) return fileDoesNotExistError

	try {
		const dbResult = await query(loadSqlQuery('delete-song.sql'), [id])
		if (dbResult?.rowCount !== 1)
			return handleDbError(new AppError(`Failed to delete song from database`, 500))

		return dbResult
	} catch (err) {
		return handleDbError(new AppError(`Failed to delete song from database`, 500, err))
	}
}

export default deleteFileFromDb
