import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3'

import { bucketName, s3 } from '../..'
import handleS3Error from './handleS3Error'
import { AppError } from '../../middleware/error-handler'

const getFileFromS3ById = async (id: string): Promise<GetObjectCommandOutput | AppError> => {
	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: id,
	})
	try {
		const result = await s3.send(command)
		if (result.$metadata.httpStatusCode !== 200)
			return handleS3Error(
				new AppError(`Failed to retrieve file from S3`, result.$metadata.httpStatusCode),
			)
		return result
	} catch (err) {
		if (err instanceof Error) {
			return handleS3Error(new AppError(`Failed to retrieve file from S3`, 500, err))
		}
		return handleS3Error(new AppError(`Failed to retrieve file from S3`, 500))
	}
}

export default getFileFromS3ById
