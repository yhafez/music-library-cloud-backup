import { Request, Response } from 'express';

class AppError extends Error {
    constructor(message: string, public statusCode: number = 500) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

function errorHandler(err: Error, req: Request, res: Response) {
    if (err instanceof AppError) {
        // Custom AppError with status code and message
        res.status(err.statusCode).json({ error: err.message });
    } else {
        // Handle other types of errors (e.g., unexpected server errors)
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export { AppError, errorHandler };
