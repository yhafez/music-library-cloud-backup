import { query } from '../db'
import loadSqlQuery from './loadSqlQuery'

// Check if the file already exists in the database
export const getFileByName = async function (fileName: string) {
	const dbCheckResult = await query(loadSqlQuery('select-song-by-name.sql'), [fileName])
	return dbCheckResult?.rows && dbCheckResult?.rows.length > 0
		? dbCheckResult?.rows[0].filename
		: null
}

export const getFileById = async function (id: string) {
	const dbCheckResult = await query(loadSqlQuery('select-song-by-id.sql'), [id])
	return dbCheckResult?.rows && dbCheckResult?.rows.length > 0
		? dbCheckResult?.rows[0].filename
		: null
}
