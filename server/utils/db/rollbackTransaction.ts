import pg from 'pg'

import { query } from '../../db'
import handleDbError from './handleDbError'
import { AppError } from '../../middleware/error-handler'

const rollbackTransaction = async (client: pg.Client): Promise<null | AppError> => {
	try {
		const result = await query({ text: 'ROLLBACK', client })
		if (!result) return handleDbError(new AppError(`Failed to rollback transaction`, 500))
		return null
	} catch (err) {
		return handleDbError(new AppError(`Failed to rollback transaction`, 500, err))
	} finally {
		client.end()
	}
}

export default rollbackTransaction
