import { QueryResult } from 'pg'

import type { Song } from '../../../types'
import { query } from '../../db'
import handleDbError from './handleDbError'
import { AppError } from '../../middleware/error-handler'

const commitTransaction = async (): Promise<QueryResult<Song> | AppError> => {
	try {
		const result = await query('COMMIT')
		if (!result) return handleDbError(new AppError(`Failed to commit transaction`, 500))
		return result
	} catch (err) {
		return handleDbError(new AppError(`Failed to commit transaction`, 500, err))
	}
}

export default commitTransaction
