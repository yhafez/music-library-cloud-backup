import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';

import { query } from '../db';
import { AppError } from '../middleware/error-handler';
import { errorValidateFileName, validateFileName } from '../middleware/validation';
import loadSqlQuery from '../utils/loadSqlQuery';

const dbRouter = Router();

// Set up storage engine
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

dbRouter.get('/list', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await query(loadSqlQuery('select-songs.sql'));
        res.json(result.rows);
    } catch (err) {
        next(
            new AppError(
                `Failed to retrieve songs from database`, 500
            )
        );
    }
});

dbRouter.post('/upload', [upload.single('file'), ...validateFileName, errorValidateFileName], async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const fileName = req.file.originalname;

    try {
        // Save to database
        const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName]);
        if (dbResult.rowCount !== 1) {
            next(
                new AppError(
                    `Failed to save song to database`, 500
                )
            )
        }

        res.json(dbResult);
    } catch (err) {
        next(
            new AppError(
                `Failed to save song to database`, 500
            )
        );
    }
});

dbRouter.delete('/songs/db/delete', [
    ...validateFileName,
    errorValidateFileName,
], async (req: Request, res: Response, next: NextFunction) => {
    const { fileName } = req.body;

    try {
        // Save to database
        const dbResult = await query(loadSqlQuery('delete-song.sql'), [fileName]);
        if (dbResult.rowCount !== 1) {
            next(
                new AppError(
                    `Failed to delete song from database`, 500
                )
            )
        }

        res.json(dbResult);
    } catch (err) {
        next(
            new AppError(
                `Failed to delete song from database`, 500
            )
        );
    }
});

export default dbRouter;
