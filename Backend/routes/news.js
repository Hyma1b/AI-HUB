import express from 'express';
import { getDbConnection } from '../database/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDbConnection();
    const news = await db.all('SELECT * FROM news ORDER BY date_published DESC');
    await db.close();
    return res.json(news);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error while fetching news' });
  }
});

export default router;
