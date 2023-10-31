import { NextFunction } from "express";

import { query } from "../db";
import loadSqlQuery from "./loadSqlQuery";

export const checkFileExists = async function (fileName: string, next: NextFunction) {
    // Check if the file already exists in the database
    const dbCheckResult = await query(loadSqlQuery('select-song.sql'), [fileName]);

    // If the file already exists, return a conflict response
    if (dbCheckResult?.rows && dbCheckResult?.rows.length > 0) {
        return next({
            message: 'File already exists.',
            statusCode: 409,
        });
    }
}