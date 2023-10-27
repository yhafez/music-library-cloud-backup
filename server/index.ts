import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import { AppError, errorHandler } from './middleware/error-handler';

import { query } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const router = express.Router();

// S3 client
const s3 = new S3({ region: 'us-east-1' });
const bucketName = process.env.S3_BUCKET_NAME;

// Set up storage engine
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Centralized Error Handling Middleware
app.use(errorHandler);

app.use('/api', router);

router.get('/health', (req, res) => {
    res.send('Hello from the API!');
});

router.get('/s3/songs/list', async (req, res, next) => {
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

router.post('/songs/s3/upload', upload.single('file'), async (req, res, next) => {
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
        const dbResult = await query('INSERT INTO songs (filename) VALUES ($1)', [fileName]);
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

router.delete('/songs/s3/delete', async (req, res, next) => {
    const { fileName } = req.body;
    try {
        // Delete from database
        const dbResult = await query('DELETE FROM songs WHERE filename = $1', [fileName]);
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

router.get('/songs/db/list', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM songs');
        res.json(result.rows);
    } catch (err) {
        next(
            new AppError(
                `Failed to retrieve songs from database`, 500
            )
        );
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
