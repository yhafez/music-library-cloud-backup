import {
	DeleteObjectCommand,
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

s3Router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const command = new ListObjectsV2Command({
			Bucket: bucketName,
		})
		const result = await s3.send(command)
		res.json(result.Contents)
	} catch (err) {
		next(new AppError(`Failed to retrieve objects from S3`, 500))
	}
})

s3Router.post(
	'/upload',
	[upload.single('file'), ...validateFileName, errorValidateFileName],
	async (req: Request, res: Response, next: NextFunction) => {
		if (!req.file) return res.status(400).send('No file uploaded.')
		const fileName = req.file.originalname
		const fileContent = req.file.buffer

		const fileExistsError = await getFileByName(fileName)
		if (fileExistsError instanceof AppError) {
			return next(fileExistsError)
		}

		let metadata: Metadata
		try {
			metadata = await getMetadata(fileName, fileContent, req.file.mimetype)
		} catch (err) {
			return next(new AppError(`Failed to parse metadata`, 500, err))
		}

		let dbResult: QueryResult<Song>
		try {
			dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName, metadata])
			// If database insert fails, rollback transaction and handle error
			if (dbResult?.rowCount !== 1) {
				await query('ROLLBACK')
				return next(new AppError(`Failed to save song to database`, 500))
			}
		} catch (err) {
			return next(new AppError(`Failed to save song to database`, 500, err))
		}

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: dbResult.rows[0].id.toString(),
			Body: fileContent,
			Metadata: { ...metadata },
		})

		let s3Result: PutObjectCommandOutput
		try {
			// Save to S3
			s3Result = await s3.send(command)
			// If S3 upload fails, rollback transaction and handle error
			if (s3Result.$metadata.httpStatusCode !== 200) {
				await query('ROLLBACK')
				return next(new AppError(`Failed to upload file to S3`, s3Result.$metadata.httpStatusCode))
			}
		} catch (err) {
			// Rollback transaction if it's still open
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
			res.json(s3Result)
		} catch (err) {
			// Rollback transaction if it's still open
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

	const fileDoesNotExistError = await getFileById(id)
	if (fileDoesNotExistError instanceof AppError) {
		return next(fileDoesNotExistError)
	}

	try {
		// Begin database transaction
		await query('BEGIN')

		// Delete from database
		const dbResult = await query(loadSqlQuery('delete-song.sql'), [id])
		// If database delete fails, rollback transaction and handle error
		if (dbResult?.rowCount !== 1) {
			await query('ROLLBACK')
			next(new AppError(`Failed to delete song from database`, 500))
		}

		// Delete from S3
		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: id,
		})
		const result = await s3.send(command)

		// If S3 delete fails, rollback transaction and handle error
		if (result.$metadata.httpStatusCode !== 204) {
			await query('ROLLBACK')
			next(new AppError(`Failed to delete object from S3`, result.$metadata.httpStatusCode))
		}

		// Commit database transaction
		await query('COMMIT')

		// Return result
		res.json(result)
	} catch (err) {
		// Rollback transaction if it's still open
		try {
			await query('ROLLBACK')
		} catch (rollbackError) {
			console.error('Rollback Error:', rollbackError)
		}

		next(new AppError(`Failed to delete object from S3`, 500))
	}
})

export default s3Router
