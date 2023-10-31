import { NextFunction, Request, Response } from 'express';

class AppError extends Error {
    public statusCode: number;
    public message: string;
    public originalError?: unknown;

    constructor(message: string, statusCode = 500, originalError?: unknown) {
        super(message);
        console.error({ message, statusCode, originalError })
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.statusCode = statusCode;
        this.message = message;
        this.originalError = originalError;
    }
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof AppError) {
        // Custom AppError with status code and message
        res.status(err.statusCode).json({
            error: err.message,
            originalError: err.originalError
        });
    } else {
        // Handle other types of errors (e.g., unexpected server errors)
        console.error('Unexpected error:', err);
        res.status(500).json({
            error: 'Internal server error',
            originalError: err
        });
    }
}

export { AppError, errorHandler };
