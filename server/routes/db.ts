import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';

import { query } from '../db';
import { AppError } from '../middleware/error-handler';
import { errorValidateFileName, validateFileName } from '../middleware/validation';
import { checkFileExists } from '../utils/checkFileExists';
import loadSqlQuery from '../utils/loadSqlQuery';

const dbRouter = Router();

// Set up storage engine
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

dbRouter.get('/list', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await query(loadSqlQuery('select-songs.sql'));
        res.json(result?.rows);
    } catch (err) {
        next(
            new AppError(
                `Failed to retrieve songs from database`, 500, err
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
        checkFileExists(fileName, next);

        // Check if the file already exists in the database
        const dbCheckResult = await query(loadSqlQuery('select-song.sql'), [fileName]);

        if (dbCheckResult?.rows && dbCheckResult?.rows.length > 0) {
            // File already exists in the database, return a conflict response
            return next({
                message: 'File already exists.',
                statusCode: 409,
            });
        }

        // Save to database
        const dbResult = await query(loadSqlQuery('insert-song.sql'), [fileName]);
        if (dbResult?.rowCount !== 1) {
            next(
                new AppError(
                    `Failed to save song to database`, 500
                )
            )
        }

        res.json(dbResult);
    } catch (err) {
        // Rollback transaction if it's still open
        try {
            await query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback Error:', rollbackError);
        }

        next(
            new AppError(
                `Failed to save song to database`, 500, err
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
        checkFileExists(fileName, next);

        // Save to database
        const dbResult = await query(loadSqlQuery('delete-song.sql'), [fileName]);
        if (dbResult?.rowCount !== 1) {
            next(
                new AppError(
                    `Failed to delete song from database`, 500
                )
            )
        }

        res.json(dbResult);
    } catch (err) {
        // Rollback transaction if it's still open
        try {
            await query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback Error:', rollbackError);
        }

        next(
            new AppError(
                `Failed to delete song from database`, 500, err
            )
        );
    }
});

export default dbRouter;
