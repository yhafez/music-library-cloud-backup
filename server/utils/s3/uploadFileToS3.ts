import { PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3'

import type { Metadata, Song } from '../../../types'
import {
	handleDbError,
	uploadFileToDb,
	beginTransaction,
	commitTransaction,
	rollbackTransaction,
} from '../db'
import { bucketName, s3 } from '../..'
import getMetadata from '../getMetadata'
import { getFileByName } from '../getFile'
import handleS3Error from './handleS3Error'
import { AppError } from '../../middleware/error-handler'
import { QueryResult } from 'pg'

const uploadFileToS3 = async (
	fileName: string,
	fileContent: Buffer,
	mimetype: string,
): Promise<PutObjectCommandOutput | AppError> => {
	// Check if file already exists
	const fileExistsError = await getFileByName(fileName)
	if (fileExistsError instanceof AppError) return handleS3Error(fileExistsError)

	// Get metadata from file
	let metadata: Metadata
	try {
		metadata = await getMetadata(fileName, fileContent, mimetype)
	} catch (err) {
		return handleS3Error(new AppError(`Failed to parse metadata`, 500, err))
	}

	const client = await beginTransaction()
	if (client instanceof AppError)
		return handleDbError(new AppError(`Failed to begin transaction`, 500))
	let dbResult: QueryResult<Song> | AppError
	try {
		dbResult = await uploadFileToDb({ fileName, metadata })
		if (dbResult instanceof AppError) {
			await rollbackTransaction(client)
			return handleDbError(dbResult)
		}
	} catch (err) {
		await rollbackTransaction(client)
		return handleDbError(new AppError(`Failed to save song to database`, 500, err))
	}

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: dbResult.rows[0].id.toString(),
		Body: fileContent,
		Metadata: { ...metadata },
	})

	try {
		const result = await s3.send(command)
		if (result.$metadata.httpStatusCode !== 200) {
			await rollbackTransaction(client)
			return handleS3Error(
				new AppError(`Failed to upload file to S3`, result.$metadata.httpStatusCode),
			)
		}
		await commitTransaction(client)
		return result
	} catch (err) {
		await rollbackTransaction(client)
		return handleS3Error(new AppError(`Failed to upload file to S3`, 500, err))
	}
}

export default uploadFileToS3
