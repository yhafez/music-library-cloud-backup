import {
	DeleteObjectCommand,
	DeleteObjectCommandOutput,
	ListObjectsV2Command,
	PutObjectCommand,
	PutObjectCommandOutput,
} from '@aws-sdk/client-s3'
import { NextFunction, Request, Response, Router } from 'express'
import multer from 'multer'

import { QueryResult } from 'pg'
import { Metadata, Song } from '../../types'
import { query } from '../db'
import { bucketName, s3 } from '../index'
import { AppError } from '../middleware/error-handler'
import { errorValidateFileName, validateFileName } from '../middleware/validation'
import { getFileById, getFileByName } from '../utils/getFile'
import getMetadata from '../utils/getMetadata'
import loadSqlQuery from '../utils/loadSqlQuery'

const s3Router = Router()

// Set up storage engine
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

s3Router.get('/list', async (_req: Request, res: Response, next: NextFunction) => {
	const command = new ListObjectsV2Command({
		Bucket: bucketName,
	})

	try {
		const result = await s3.send(command)
		if (result.$metadata.httpStatusCode !== 200) {
			return next(
				new AppError(`Failed to retrieve objects from S3`, result.$metadata.httpStatusCode),
			)
		}

		return res.json(result.Contents)
	} catch (err) {
		return next(new AppError(`Failed to retrieve objects from S3`, 500))
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

		// Check if file already exists
		const fileExistsError = await getFileByName(fileName)
		if (fileExistsError instanceof AppError) {
			return next(fileExistsError)
		}

		// Get metadata from file
		let metadata: Metadata
		try {
			metadata = await getMetadata(fileName, fileContent, req.file.mimetype)
		} catch (err) {
			return next(new AppError(`Failed to parse metadata`, 500, err))
		}

		// Begin database transaction to save file
		let dbResult: QueryResult<Song>
		try {
			await query('BEGIN')

			dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName, metadata])
			// If database insert fails, rollback transaction and handle error
			if (dbResult?.rowCount !== 1) {
				await query('ROLLBACK')
				return next(new AppError(`Failed to save song to database`, 500))
			}
		} catch (err) {
			return next(new AppError(`Failed to save song to database`, 500, err))
		}

		// Save to S3
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: dbResult.rows[0].id.toString(),
			Body: fileContent,
			Metadata: { ...metadata },
		})

		let s3Result: PutObjectCommandOutput
		try {
			s3Result = await s3.send(command)
			// If S3 upload fails, rollback transaction and handle error
			if (s3Result.$metadata.httpStatusCode !== 200) {
				await query('ROLLBACK')
				return next(new AppError(`Failed to upload file to S3`, s3Result.$metadata.httpStatusCode))
			}
		} catch (err) {
			// If S3 upload fails, rollback transaction if still open and handle error
			try {
				await query('ROLLBACK')
			} catch (rollbackError) {
				console.error('Rollback Error:', rollbackError)
			}
			return next(new AppError(`Failed to upload file to S3`, 500, err))
		}

		try {
			// Commit database transaction
			await query('COMMIT')
			return res.json(s3Result)
		} catch (err) {
			// If commit fails, rollback transaction if still open and handle error
			try {
				await query('ROLLBACK')
			} catch (rollbackError) {
				console.error('Rollback Error:', rollbackError)
			}
			return next(new AppError(`Failed to commit transaction`, 500, err))
		}
	},
)

s3Router.delete('/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params

	// Check if file exists
	const fileDoesNotExistError = await getFileById(id)
	if (fileDoesNotExistError instanceof AppError) {
		return next(fileDoesNotExistError)
	}

	// Begin database transaction to delete song
	try {
		await query('BEGIN')

		const dbResult = await query(loadSqlQuery('delete-song.sql'), [id])
		// If database delete fails, rollback transaction and handle error
		if (dbResult?.rowCount !== 1) {
			await query('ROLLBACK')
			return next(new AppError(`Failed to delete song from database`, 500))
		}
	} catch (err) {
		// If database delete fails, rollback transaction if still open and handle error
		try {
			await query('ROLLBACK')
		} catch (rollbackError) {
			console.error('Rollback Error:', rollbackError)
		}
		return next(new AppError(`Failed to delete song from database`, 500, err))
	}

	// Delete from S3
	const command = new DeleteObjectCommand({
		Bucket: bucketName,
		Key: id,
	})
	let s3Result: DeleteObjectCommandOutput
	try {
		s3Result = await s3.send(command)

		// If S3 delete fails, rollback transaction and handle error
		if (s3Result.$metadata.httpStatusCode !== 204) {
			await query('ROLLBACK')
			return next(
				new AppError(`Failed to delete object from S3`, s3Result.$metadata.httpStatusCode),
			)
		}
	} catch (err) {
		// If S3 delete fails, rollback transaction if still open and handle error
		try {
			await query('ROLLBACK')
		} catch (rollbackError) {
			console.error('Rollback Error:', rollbackError)
		}
		return next(new AppError(`Failed to delete object from S3`, 500, err))
	}

	try {
		// Commit database transaction
		await query('COMMIT')
		return res.json(s3Result)
	} catch (err) {
		// If commit fails, rollback transaction if still open and handle error
		try {
			await query('ROLLBACK')
		} catch (rollbackError) {
			console.error('Rollback Error:', rollbackError)
		}
		return next(new AppError(`Failed to commit transaction`, 500, err))
	}
})

export default s3Router
