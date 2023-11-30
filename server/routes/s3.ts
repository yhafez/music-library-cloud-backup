import multer from 'multer'
import { NextFunction, Request, Response, Router } from 'express'

import { AppError } from '../middleware/error-handler'
import { errorValidateFileName, validateFileName } from '../middleware/validation'
import { deleteSongFromS3, downloadFileFromS3, listFilesInS3, uploadFileToS3 } from '../utils/s3'

const s3Router = Router()

// Set up storage engine
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

s3Router.get('/list', async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const s3Result = await listFilesInS3()
		if (s3Result instanceof AppError) return next(s3Result)
		return res.json(s3Result.Contents)
	} catch (err) {
		return next(err)
	}
})

s3Router.post(
	'/upload',
	[upload.single('file'), ...validateFileName, errorValidateFileName],
	async (req: Request, res: Response, next: NextFunction) => {
		// Confirm file was uploaded
		if (!req.file) return res.status(400).send('No file uploaded.')
		const fileName = req.file.originalname
		const fileContent = req.file.buffer

		try {
			const s3Result = await uploadFileToS3(fileName, fileContent, req.file.mimetype)
			if (s3Result instanceof AppError) return next(s3Result)
			return res.json(s3Result)
		} catch (err) {
			return next(err)
		}
	},
)

s3Router.delete('/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params

	try {
		const s3Result = await deleteSongFromS3(id)
		if (s3Result instanceof AppError) return next(s3Result)
		return res.json(s3Result)
	} catch (err) {
		return next(err)
	}
})

s3Router.get('/download/:id', async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params

	try {
		const s3Result = await downloadFileFromS3(id)
		if (s3Result instanceof AppError) return next(s3Result)

		const { readableStream, result } = s3Result
		if (!result.ContentType || !result.Metadata?.filename || !result.ContentLength)
			return next(new AppError(`Failed to retrieve file from S3`, 500))

		// Set headers for download
		res.setHeader('Content-Type', result.ContentType)
		res.setHeader('Content-Disposition', `attachment; filename=${result.Metadata.filename}`)
		res.setHeader('Content-Length', result.ContentLength)

		// Return file as stream
		return readableStream.pipe(res)
	} catch (err) {
		console.error(err)
		return next(new AppError(`Failed to retrieve file from S3`, 500))
	}
})

export default s3Router
