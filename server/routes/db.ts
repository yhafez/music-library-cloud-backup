import { NextFunction, Request, Response, Router } from 'express'
import multer from 'multer'

import { AppError } from '../middleware/error-handler'
import { errorValidateFileName, validateFileName } from '../middleware/validation'
import { deleteFileFromDb, listFilesInDb, uploadFileToDb, syncDbWithS3 } from '../utils/database'

const dbRouter = Router()

// Set up storage engine
const storage = multer.memoryStorage()
export const upload = multer({ storage: storage })

dbRouter.get('/list', async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const dbResult = await listFilesInDb()
		if (dbResult instanceof AppError) return next(dbResult)
		return res.json(dbResult.rows)
	} catch (err) {
		return next(err)
	}
})

dbRouter.post(
	'/upload',
	[upload.single('file'), ...validateFileName, errorValidateFileName],
	async (req: Request, res: Response, next: NextFunction) => {
		// Confirm file was uploaded
		if (!req.file) return res.status(400).send('No file uploaded.')
		const fileName = req.file.originalname
		const fileContent = req.file.buffer

		try {
			const dbResult = await uploadFileToDb(fileName, fileContent, req.file.mimetype)
			if (dbResult instanceof AppError) return next(dbResult)
		} catch (err) {
			return next(err)
		}
	},
)

dbRouter.delete('/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params

	try {
		const dbResult = await deleteFileFromDb(id)
		if (dbResult instanceof AppError) return next(dbResult)
		return res.json(dbResult.rows)
	} catch (err) {
		return next(err)
	}
})

dbRouter.get('/sync', async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const dbResult = await syncDbWithS3()
		if (dbResult instanceof AppError) return next(dbResult)
		return res.json(dbResult)
	} catch (err) {
		return next(err)
	}
})

export default dbRouter
