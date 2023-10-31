import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import sanitizeFilename from 'sanitize-filename';

// Regular validation and sanitization middleware for the 'fileName' field
const validateFileName: RequestHandler[] = [
    // Validation and sanitization rules for the 'fileName' field
    (req: Request, res: Response, next: NextFunction) => {
        // Perform validation and sanitization here...
        req.body.fileName = sanitizeFilename(req.file?.originalname || '');

        // Continue to the next middleware
        next();
    },
];

// Error handling middleware for the 'fileName' field
const errorValidateFileName: ErrorRequestHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err.errors) {
        // Handle validation errors (e.g., from express-validator)
        const validationErrors = err.errors.map((error: any) => ({
            param: error.param,
            message: error.msg,
        }));

        // Respond with a 400 Bad Request status and send the validation errors
        res.status(400).json({ errors: validationErrors });
    } else if (err.message) {
        // Handle other types of errors with a custom message
        res.status(400).json({ error: err.message });
    } else {
        // For unexpected errors, respond with a generic error message and a 500 Internal Server Error status
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { errorValidateFileName, validateFileName };
