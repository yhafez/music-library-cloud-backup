import dotenv from 'dotenv'
import pg, { QueryConfig, QueryResult } from 'pg'
import { Song } from '../types'
const { Pool } = pg

dotenv.config()

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASS,
	port: parseInt(process.env.DB_PORT || '5432'),
})

export const query = async (text: string, params?: QueryConfig['values']) => {
	try {
		return (await pool.query(text, params)) as QueryResult<Song>
	} catch (err) {
		console.error('Error executing query:', err)
		throw err
	}
}
