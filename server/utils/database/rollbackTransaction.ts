import { QueryResult } from 'pg'

import type { Song } from '../../../types'
import { query } from '../../db'
import { AppError } from '../../middleware/error-handler'
import handleDbError from './handleDbError'

const rollbackTransaction = async (): Promise<QueryResult<Song> | AppError> => {
	try {
		const result = await query('ROLLBACK')
		if (!result) return handleDbError(new AppError(`Failed to rollback transaction`, 500))
		return result
	} catch (err) {
		return handleDbError(new AppError(`Failed to rollback transaction`, 500, err))
	}
}

export default rollbackTransaction
