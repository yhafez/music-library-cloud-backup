import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { parseBuffer } from 'music-metadata';

import { query } from '../db';
import { bucketName, s3 } from '../index';
import { AppError } from '../middleware/error-handler';
import { errorValidateFileName, validateFileName } from '../middleware/validation';
import { checkFileExists } from '../utils/checkFileExists';
import loadSqlQuery from '../utils/loadSqlQuery';

const s3Router = Router();

// Set up storage engine
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

s3Router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
        });
        const result = await s3.send(command);
        res.json(result.Contents);
    } catch (err) {
        next(
            new AppError(
                `Failed to retrieve objects from S3`, 500
            )
        );
    }
});

s3Router.post('/upload', [upload.single('file'), ...validateFileName, errorValidateFileName], async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const fileName = req.file.originalname;
    const fileContent = req.file.buffer;

    try {
        checkFileExists(fileName, next);

        try {
            const metadata = await parseBuffer(fileContent, { mimeType: req.file.mimetype });
            console.log({ metadata });
            return;
        } catch (err) {
            return next(
                new AppError(
                    `Failed to parse metadata`, 500, err
                )
            );
        }

        // Begin database transaction
        await query('BEGIN');

        // Save to database
        const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName]);

        // If database insert fails, rollback transaction and handle error
        if (dbResult?.rowCount !== 1) {
            await query('ROLLBACK');
            return next(
                new AppError(
                    `Failed to save song to database`, 500
                )
            );
        }

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileContent,
        });

        // Save to S3
        const result = await s3.send(command);

        // If S3 upload fails, rollback transaction and handle error
        if (result.$metadata.httpStatusCode !== 200) {
            await query('ROLLBACK');
            return next(
                new AppError(
                    `Failed to upload file to S3`, 500
                )
            );
        }

        // Commit database transaction
        await query('COMMIT');

        // Return result
        res.json(result);
    }
    catch (err) {
        // Rollback transaction if it's still open
        try {
            await query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback Error:', rollbackError);
        }

        return next(
            new AppError(
                `Failed to upload file to S3`, 500, err
            )
        );
    }
});

s3Router.delete('/delete', [
    ...validateFileName,
    errorValidateFileName,
], async (req: Request, res: Response, next: NextFunction) => {
    const { fileName } = req.body;
    try {
        checkFileExists(fileName, next);

        // Begin database transaction
        await query('BEGIN');

        // Delete from database
        const dbResult = await query(loadSqlQuery('delete-song.sql'), [fileName]);
        // If database delete fails, rollback transaction and handle error
        if (dbResult?.rowCount !== 1) {
            await query('ROLLBACK');
            next(
                new AppError(
                    `Failed to delete song from database`, 500
                )
            )
        }

        // Delete from S3
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileName,
        });
        const result = await s3.send(command);

        // If S3 delete fails, rollback transaction and handle error
        if (result.$metadata.httpStatusCode !== 204) {
            await query('ROLLBACK');
            next(
                new AppError(
                    `Failed to delete object from S3`, 500
                )
            )
        }

        // Commit database transaction
        await query('COMMIT');

        // Return result
        res.json(result);
    }
    catch (err) {
        // Rollback transaction if it's still open
        try {
            await query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback Error:', rollbackError);
        }

        next(
            new AppError(
                `Failed to delete object from S3`, 500
            )
        );
    }
})

export default s3Router;
