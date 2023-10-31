import { S3 } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import express from 'express';

import { errorHandler } from './middleware/error-handler';
import songsRouter from './routes/songs';


dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// S3 client
export const s3 = new S3({ region: 'us-west-1' });
export const bucketName = process.env.S3_BUCKET_NAME;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(errorHandler);

app.use('/api/songs', songsRouter);

app.get('/health', (_req, res) => {
    res.send('Hello from the API!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
