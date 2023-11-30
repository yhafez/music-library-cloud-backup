import { QueryResult } from 'pg'

import type { Metadata, Song } from '../../../types'
import { query } from '../../db'
import getMetadata from '../getMetadata'
import { getFileByName } from '../getFile'
import handleDbError from './handleDbError'
import loadSqlQuery from '../../utils/loadSqlQuery'
import { AppError } from '../../middleware/error-handler'

const uploadFileToDb = async (
	fileName: string,
	fileContent: Buffer,
	fileMimeType: string,
): Promise<QueryResult<Song> | AppError> => {
	const fileExistsError = await getFileByName(fileName)
	if (fileExistsError instanceof AppError) return handleDbError(fileExistsError)

	// Get metadata from file
	let metadata: Metadata
	try {
		metadata = await getMetadata(fileName, fileContent, fileMimeType)
	} catch (err) {
		return handleDbError(new AppError(`Failed to parse metadata`, 500, err))
	}

	try {
		const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName, metadata])
		if (dbResult?.rowCount !== 1)
			return handleDbError(new AppError(`Failed to save song to database`, 500))

		return dbResult
	} catch (err) {
		return handleDbError(new AppError(`Failed to save song to database`, 500, err))
	}
}

export default uploadFileToDb
