import { QueryResult } from 'pg'

import type { Metadata, Song } from '../../../types'
import { query } from '../../db'
import getMetadata from '../getMetadata'
import { getFileByName } from '../getFile'
import loadSqlQuery from '../loadSqlQuery'
import handleDbError from './handleDbError'
import { AppError } from '../../middleware/error-handler'

interface UploadFileToDb {
	fileName: string
	fileContent?: Buffer
	fileMimeType?: string
	metadata?: Metadata
}

const uploadFileToDb = async ({
	fileName,
	fileContent,
	fileMimeType,
	metadata,
}: UploadFileToDb): Promise<QueryResult<Song> | AppError> => {
	const fileExistsError = await getFileByName(fileName)
	if (fileExistsError instanceof AppError) return handleDbError(fileExistsError)

	let metadataResults: Metadata
	if (metadata) {
		metadataResults = metadata
	} else {
		if (!fileContent || !fileMimeType)
			return handleDbError(new AppError(`Failed to parse metadata`, 500))
		try {
			metadataResults = await getMetadata(fileName, fileContent, fileMimeType)
		} catch (err) {
			return handleDbError(new AppError(`Failed to parse metadata`, 500, err))
		}
	}

	try {
		const dbResult = await query({
			text: loadSqlQuery('insert-song.sql'),
			params: [fileName, metadataResults],
		})
		if (dbResult?.rowCount !== 1)
			return handleDbError(new AppError(`Failed to save song to database`, 500))

		return dbResult
	} catch (err) {
		return handleDbError(new AppError(`Failed to save song to database`, 500, err))
	}
}

export default uploadFileToDb
