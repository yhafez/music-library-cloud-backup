import fs from 'fs';
import path from 'path';

type QueryParam = string | number;

export default function loadSqlQuery(fileName: string, params: QueryParam[] = []): string {
    const filePath = path.join(path.resolve(), 'server/sql', fileName);
    const sqlQuery = fs.readFileSync(filePath, 'utf-8');

    if (params.length === 0) return sqlQuery;

    // Replace placeholders with parameters
    return sqlQuery.replace(/\$(\d+)/g, (match, index) => {
        const paramIndex = parseInt(index) - 1;
        if (paramIndex >= 0 && paramIndex < params.length) {
            return params[paramIndex].toString(); // Ensure it's a string
        }
        throw new Error(`Invalid parameter index: ${index}`);
    });
}