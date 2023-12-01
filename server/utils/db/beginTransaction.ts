import pg from 'pg'

import handleDbError from './handleDbError'
import { createDbConnection, query } from '../../db'
import { AppError } from '../../middleware/error-handler'

const beginTransaction = async (): Promise<pg.Client | AppError> => {
	const client = createDbConnection();
	try {
		await client.connect();
		await query({text: 'BEGIN', client});
		return client;
	} catch (err) {
		client.end();
		return handleDbError(new AppError(`Failed to begin transaction`, 500, err));
	}
  };

export default beginTransaction
