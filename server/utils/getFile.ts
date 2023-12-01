import { query } from '../db'
import { AppError } from '../middleware/error-handler'
import loadSqlQuery from './loadSqlQuery'

// Check if the file already exists in the database
export const getFileByName = async function (fileName: string) {
	try {
		const dbCheckResult = await query({text: loadSqlQuery('select-song-by-name.sql'), params: [fileName]})
		if (dbCheckResult?.rows && dbCheckResult?.rows.length > 0) {
			return new AppError('File already exists in database.', 409)
		}

		return false
	} catch (err) {
		return new AppError(`Failed to check if file exists in database`, 500, err)
	}
}

export const getFileById = async function (id: string) {
	try {
		const dbCheckResult = await query({text: loadSqlQuery('select-song-by-id.sql'), params: [id]})
		if (dbCheckResult?.rows && dbCheckResult?.rows.length === 0) {
			return new AppError('File does not exist in database.', 409)
		}

		return true
	} catch (err) {
		return new AppError(`Failed to check if file exists in database`, 500, err)
	}
}
