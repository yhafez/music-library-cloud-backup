import { Metadata } from '../../types'
import { query } from '../db'
import loadSqlQuery from './loadSqlQuery'

const saveFileToDb = async (fileName: string, metadata: Metadata) => {
	await query('BEGIN')
	const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName, metadata])
	return dbResult
}

export default saveFileToDb
