import { QueryResult } from 'pg'
import { ListObjectsV2Output } from '@aws-sdk/client-s3'

import { Song } from '../../../types'
import listFilesInDb from './listFilesInDb'
import handleDbError from './handleDbError'
import { handleS3Error, listFilesInS3 } from '../s3'
import { AppError } from '../../middleware/error-handler'
import uploadFileFromS3ToDb from './uploadFileFromS3ToDb'
import deleteFileFromS3FromDb from './deleteFileFromS3FromDb'

const syncDbWithS3 = async (): Promise<
	{ songsToAdd: string[]; songsToDelete: number[] } | AppError
> => {
	let s3Result: ListObjectsV2Output | AppError
	try {
		s3Result = await listFilesInS3()
		if (s3Result instanceof AppError) return s3Result
	} catch (err) {
		return handleS3Error(err)
	}

	let dbResult: QueryResult<Song> | AppError
	try {
		dbResult = await listFilesInDb()
		if (dbResult instanceof AppError) return dbResult
	} catch (err) {
		return handleDbError(err)
	}

	const dbSongIds = dbResult.rows.map(row => row.id)
	const s3SongIds =
		(s3Result.Contents?.map(object => object.Key).filter(key => key !== undefined) as string[]) ??
		[]

	const songsToAdd = s3SongIds.filter(id => !dbSongIds.includes(+id))
	const songsToDelete = dbSongIds.filter(id => !s3SongIds.includes(id.toString()))

	for (const id of songsToAdd) {
		try {
			await uploadFileFromS3ToDb(id)
		} catch (err) {
			handleDbError(err)
			continue
		}
	}

	for (const id of songsToDelete) {
		try {
			await deleteFileFromS3FromDb(id)
		} catch (err) {
			handleDbError(err)
			continue
		}
	}

	try {
		return { songsToAdd, songsToDelete }
	} catch (err) {
		return handleDbError(err)
	}
}

export default syncDbWithS3
