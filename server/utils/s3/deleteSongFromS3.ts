import { DeleteObjectCommand, DeleteObjectCommandOutput } from '@aws-sdk/client-s3'

import {
	beginTransaction,
	commitTransaction,
	rollbackTransaction,
	deleteFileFromDb,
	handleDbError,
} from '../db'
import { bucketName, s3 } from '../..'
import { getFileById } from '../getFile'
import handleS3Error from './handleS3Error'
import { AppError } from '../../middleware/error-handler'

const deleteSongFromS3 = async (id: string): Promise<DeleteObjectCommandOutput | AppError> => {
	const fileDoesNotExistError = await getFileById(id)
	if (fileDoesNotExistError instanceof AppError) return handleS3Error(fileDoesNotExistError)

	const client = await beginTransaction()
	if (client instanceof AppError)
		return handleDbError(new AppError(`Failed to begin transaction`, 500))
	try {
		const dbResult = deleteFileFromDb(id)
		if (dbResult instanceof AppError) {
			await rollbackTransaction(client)
			return handleDbError(dbResult)
		}
	} catch (err) {
		await rollbackTransaction(client)
		return handleDbError(new AppError(`Failed to delete song from database`, 500, err))
	}

	const command = new DeleteObjectCommand({
		Bucket: bucketName,
		Key: id,
	})
	try {
		const s3Result = await s3.send(command)
		if (s3Result.$metadata.httpStatusCode !== 204) {
			await rollbackTransaction(client)
			return handleS3Error(
				new AppError(`Failed to delete object from S3`, s3Result.$metadata.httpStatusCode),
			)
		}
		await commitTransaction(client)
		return s3Result
	} catch (err) {
		await rollbackTransaction(client)
		return handleS3Error(new AppError(`Failed to delete object from S3`, 500, err))
	}
}

export default deleteSongFromS3
