import dotenv from 'dotenv';
import { Pool, QueryConfig, QueryResult } from 'pg';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const query = (text: string, params?: QueryConfig['values']) => pool.query(text, params) as Promise<QueryResult<Record<string, unknown>>>;
