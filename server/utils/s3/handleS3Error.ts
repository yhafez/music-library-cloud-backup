import { AppError } from '../../middleware/error-handler'

const handleS3Error = (err: unknown): AppError => {
	console.error(err)
	const error = err as Error
	return new AppError(`Failed to retrieve objects from S3`, 500, error)
}

export default handleS3Error
