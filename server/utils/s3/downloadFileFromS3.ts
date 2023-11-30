import { Readable } from 'stream'
import { GetObjectCommand } from '@aws-sdk/client-s3'

import { bucketName, s3 } from '../..'
import { getFileById } from '../getFile'
import handleS3Error from './handleS3Error'
import { AppError } from '../../middleware/error-handler'

const downloadFileFromS3 = async (id: string) => {
	const fileDoesNotExistError = await getFileById(id)
	if (fileDoesNotExistError instanceof AppError) return handleS3Error(fileDoesNotExistError)

	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: id,
	})

	try {
		const result = await s3.send(command)
		if (result.$metadata.httpStatusCode !== 200)
			return handleS3Error(
				new AppError(`Failed to retrieve objects from S3`, result.$metadata.httpStatusCode),
			)

		if (!result.Body) return handleS3Error(new AppError(`Failed to retrieve file from S3`, 500))

		// Convert blob to byte array
		const chunks = await result.Body.transformToByteArray()

		// Create a readable stream from the byte array
		const readableStream = Readable.from([chunks])

		return { readableStream, result }
	} catch (err) {
		console.error(err)
		return handleS3Error(new AppError(`Failed to retrieve file from S3`, 500))
	}
}

export default downloadFileFromS3
