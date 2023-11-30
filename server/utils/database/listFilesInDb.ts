import { QueryResult } from 'pg'

import type { Song } from '../../../types'
import { query } from '../../db'
import handleDbError from './handleDbError'
import loadSqlQuery from '../../utils/loadSqlQuery'
import { AppError } from '../../middleware/error-handler'

const listFilesInDb = async (): Promise<QueryResult<Song> | AppError> => {
	try {
		const result = await query(loadSqlQuery('select-songs.sql'))
		if (!result) return handleDbError(new AppError(`Failed to retrieve songs from database`, 500))
		return result
	} catch (err) {
		return handleDbError(new AppError(`Failed to retrieve songs from database`, 500, err))
	}
}

export default listFilesInDb
