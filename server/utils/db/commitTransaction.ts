import pg from 'pg'

import { query } from '../../db'
import handleDbError from './handleDbError'
import { AppError } from '../../middleware/error-handler'

const commitTransaction = async (client: pg.Client): Promise<null | AppError> => {
	try {
		await query({text: 'COMMIT', client});
		return null;
	} catch (err) {
		return handleDbError(new AppError(`Failed to commit transaction`, 500, err));
	} finally {
		client.end();
	}
  };

export default commitTransaction
