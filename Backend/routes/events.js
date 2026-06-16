import express from 'express';
import { getDbConnection } from '../database/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDbConnection();
    const events = await db.all('SELECT * FROM events ORDER BY date ASC');
    await db.close();
    return res.json(events);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error while fetching events' });
  }
});

export default router;
