import { NextFunction, Request, Response, Router } from 'express'
import multer from 'multer'

import { Metadata } from '../../types'
import { query } from '../db'
import { AppError } from '../middleware/error-handler'
import { errorValidateFileName, validateFileName } from '../middleware/validation'
import { getFileById, getFileByName } from '../utils/getFile'
import getMetadata from '../utils/getMetadata'
import loadSqlQuery from '../utils/loadSqlQuery'

const dbRouter = Router()

// Set up storage engine
const storage = multer.memoryStorage()
export const upload = multer({ storage: storage })

dbRouter.get('/list', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const result = await query(loadSqlQuery('select-songs.sql'))
		res.json(result?.rows)
	} catch (err) {
		next(new AppError(`Failed to retrieve songs from database`, 500, err))
	}
})

dbRouter.post(
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

		try {
			const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName, metadata])
			// If database insert fails, rollback transaction and handle error
			if (dbResult?.rowCount !== 1) {
				await query('ROLLBACK')
				return next(new AppError(`Failed to save song to database`, 500))
			}
			res.json(dbResult)
		} catch (err) {
			return next(new AppError(`Failed to save song to database`, 500, err))
		}
	},
)

dbRouter.delete('/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params

	const fileDoesNotExistError = await getFileById(id)
	if (fileDoesNotExistError instanceof AppError) {
		return next(fileDoesNotExistError)
	}

	try {
		// Save to database
		const dbResult = await query(loadSqlQuery('delete-song.sql'), [id])
		if (dbResult?.rowCount !== 1) {
			next(new AppError(`Failed to delete song from database`, 500))
		}

		res.json(dbResult)
	} catch (err) {
		// Rollback transaction if it's still open
		try {
			await query('ROLLBACK')
		} catch (rollbackError) {
			console.error('Rollback Error:', rollbackError)
		}

		next(new AppError(`Failed to delete song from database`, 500, err))
	}
})

// dbRouter.get('/sync', async (req: Request, res: Response, next: NextFunction) => {
// 	let s3Result: ListObjectsV2Output
// 	try {
// 		const command = new ListObjectsV2Command({
// 			Bucket: bucketName,
// 		})
// 		s3Result = await s3.send(command)
// 	} catch (err) {
// 		if (err instanceof Error) {
// 			return next(new AppError(`Failed to retrieve objects from S3`, 500, err))
// 		}
// 		return next(new AppError(`Failed to retrieve objects from S3`, 500))
// 	}

// 	let dbResult: QueryResult<Song>
// 	try {
// 		dbResult = await query(loadSqlQuery('select-songs.sql'))
// 	} catch (err) {
// 		if (err instanceof Error) {
// 			return next(new AppError(`Failed to retrieve songs from database`, 500, err))
// 		}
// 		return next(new AppError(`Failed to retrieve songs from database`, 500))
// 	}

// 	const dbSongs = dbResult.rows.map(row => row.filename)
// 	const s3Songs =
// 		s3Result.Contents?.map(content => content.Key).filter(
// 			(key): key is string => typeof key === 'string',
// 		) || []

// 	const songsToAdd = s3Songs.filter(song => !dbSongs.includes(song))
// 	const songsToDelete = dbSongs.filter(song => !s3Songs.includes(song))

// 	await query('BEGIN')

// 	for (const song of songsToAdd) {
// 		const { dbResult } = await saveFileToDb(song, Buffer.from(''), '')
// 		if (dbResult?.rowCount !== 1) {
// 			await query('ROLLBACK')
// 			return next(new AppError(`Failed to save song to database`, 500))
// 		}
// 	}

// 	for (const song of songsToDelete) {
// 		const dbResult = await query(loadSqlQuery('delete-song.sql'), [song])
// 		if (dbResult?.rowCount !== 1) {
// 			await query('ROLLBACK')
// 			return next(new AppError(`Failed to delete song from database`, 500))
// 		}
// 	}

// 	await query('COMMIT')
// 	res.json({ songsToAdd, songsToDelete })
// })

export default dbRouter
