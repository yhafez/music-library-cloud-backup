import { AppError } from '../../middleware/error-handler'

const handleDbError = (err: unknown): AppError => {
	console.error(err)
	const error = err as Error
	return new AppError(`Database operation failed`, 500, error)
}

export default handleDbError
