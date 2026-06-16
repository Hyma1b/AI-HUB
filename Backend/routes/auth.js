import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbConnection } from '../database/db.js';
import { JWT_SECRET, requireRole } from '../middleware/auth.js';

const router = express.Router();

// User Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const db = await getDbConnection();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    await db.close();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error during authentication' });
  }
});

// Get Current User Profile
router.get('/me', requireRole(['employee', 'admin']), (req, res) => {
  return res.json({ user: req.user });
});

export default router;
