import { QueryResult } from 'pg'

import type { Song } from '../../../types'
import { query } from '../../db'
import handleDbError from './handleDbError'
import loadSqlQuery from '../../utils/loadSqlQuery'
import { AppError } from '../../middleware/error-handler'

const deleteFileFromS3FromDb = async (id: number): Promise<QueryResult<Song> | AppError> => {
	try {
		const dbResult = await query(loadSqlQuery('delete-song.sql'), [id])
		if (dbResult?.rowCount !== 1)
			return handleDbError(new AppError(`Failed to delete song from database`, 500))

		console.info(`Successfully deleted song with id ${id} from database`)
		return dbResult
	} catch (err) {
		return handleDbError(new AppError(`Failed to delete song from database`, 500, err))
	}
}

export default deleteFileFromS3FromDb
