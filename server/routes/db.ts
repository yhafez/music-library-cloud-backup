import { NextFunction, Request, Response, Router } from 'express'
import multer from 'multer'

import { GetObjectCommand, ListObjectsV2Command, ListObjectsV2Output } from '@aws-sdk/client-s3'
import { QueryResult } from 'pg'
import { bucketName, s3 } from '..'
import { Metadata, Song } from '../../types'
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

dbRouter.get('/list', async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const result = await query(loadSqlQuery('select-songs.sql'))
		if (!result) {
			return next(new AppError(`Failed to retrieve songs from database`, 500))
		}

		return res.json(result?.rows)
	} catch (err) {
		return next(new AppError(`Failed to retrieve songs from database`, 500, err))
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

		// Begin database operation to save file
		try {
			const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName, metadata])
			if (dbResult?.rowCount !== 1) {
				return next(new AppError(`Failed to save song to database`, 500))
			}

			return res.json(dbResult)
		} catch (err) {
			return next(new AppError(`Failed to save song to database`, 500, err))
		}
	},
)

dbRouter.delete('/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params

	// Check if file exists
	const fileDoesNotExistError = await getFileById(id)
	if (fileDoesNotExistError instanceof AppError) {
		return next(fileDoesNotExistError)
	}

	// Begin database operation to delete file
	try {
		const dbResult = await query(loadSqlQuery('delete-song.sql'), [id])
		if (dbResult?.rowCount !== 1) {
			return next(new AppError(`Failed to delete song from database`, 500))
		}

		return res.json(dbResult)
	} catch (err) {
		return next(new AppError(`Failed to delete song from database`, 500, err))
	}
})

dbRouter.get('/sync', async (_req: Request, res: Response, next: NextFunction) => {
	const command = new ListObjectsV2Command({
		Bucket: bucketName,
	})
	let s3Result: ListObjectsV2Output
	try {
		s3Result = await s3.send(command)
	} catch (err) {
		if (err instanceof Error) {
			return next(new AppError(`Failed to retrieve objects from S3`, 500, err))
		}
		return next(new AppError(`Failed to retrieve objects from S3`, 500))
	}

	let dbResult: QueryResult<Song>
	try {
		dbResult = await query(loadSqlQuery('select-songs.sql'))
	} catch (err) {
		if (err instanceof Error) {
			return next(new AppError(`Failed to retrieve songs from database`, 500, err))
		}
		return next(new AppError(`Failed to retrieve songs from database`, 500))
	}

	const dbSongIds = dbResult.rows.map(row => row.id)
	const s3SongIds =
		(s3Result.Contents?.map(object => object.Key).filter(key => key !== undefined) as string[]) ??
		[]

	const songsToAdd = s3SongIds.filter(id => !dbSongIds.includes(+id))
	const songsToDelete = dbSongIds.filter(id => !s3SongIds.includes(id.toString()))

	try {
		await query('BEGIN')
	} catch (err) {
		next(new AppError(`Failed to begin transaction`, 500, err))
	}

	for (const song of songsToAdd) {
		const getCommand = new GetObjectCommand({
			Bucket: bucketName,
			Key: song,
		})

		let fileStream
		try {
			fileStream = await s3.send(getCommand)
		} catch (err) {
			next(new AppError(`Failed to retrieve file with id ${song} from S3`, 500))
			continue
		}

		const metadata = fileStream.Metadata
		if (!metadata) {
			next(new AppError(`Failed to retrieve metadata for file with id ${song} from S3`, 500))
			continue
		}

		try {
			const dbResult = await query(loadSqlQuery('insert-song.sql'), [metadata.filename, metadata])
			if (dbResult?.rowCount !== 1) {
				next(new AppError(`Failed to save song with id ${song} to database`, 500))
				continue
			}

			console.info(`Successfully saved song with id ${song} to database`)
		} catch (err) {
			next(new AppError(`Failed to save song with id ${song} to database`, 500, err))
			continue
		}
	}

	for (const song of songsToDelete) {
		try {
			const dbResult = await query(loadSqlQuery('delete-song.sql'), [song])
			if (dbResult?.rowCount !== 1) {
				next(new AppError(`Failed to delete song with id ${song} from database`, 500))
				continue
			}

			console.info(`Successfully deleted song with id ${song} from database`)
		} catch (err) {
			next(new AppError(`Failed to delete song with id ${song} from database`, 500, err))
			continue
		}
	}

	try {
		await query('COMMIT')
		return res.json({ songsToAdd, songsToDelete })
	} catch (err) {
		return next(new AppError(`Failed to commit transaction`, 500, err))
	}
})

export default dbRouter
