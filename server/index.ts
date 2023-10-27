import dotenv from 'dotenv';
import express from 'express';

import pool from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const router = express.Router();

app.use('/api', router);

router.get('/', (req, res) => {
    res.send('Hello from the API!');
});

router.get('/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM your_table');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
