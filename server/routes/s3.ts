import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';

import { query } from '../db';
import { bucketName, s3 } from '../index';
import { AppError } from '../middleware/error-handler';
import { errorValidateFileName, validateFileName } from '../middleware/validation';
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
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const fileName = req.file.originalname;
    const fileContent = req.file.buffer;

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileContent,
        });

        // Save to database
        const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName]);
        if (dbResult.rowCount !== 1) {
            next(
                new AppError(
                    `Failed to save song to database`, 500
                )
            )
        }

        // Save to S3
        const result = await s3.send(command);
        if (result.$metadata.httpStatusCode !== 200) {
            throw new Error('S3 upload failed');
        }

        res.json(result);
    }
    catch (err) {
        next(
            new AppError(
                `Failed to upload file to S3`, 500
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
        // Delete from database
        const dbResult = await query(loadSqlQuery('delete-song.sql'), [fileName]);
        if (dbResult.rowCount !== 1) {
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
        res.json(result);
    }
    catch (err) {
        next(
            new AppError(
                `Failed to delete object from S3`, 500
            )
        );
    }
})

export default s3Router;
