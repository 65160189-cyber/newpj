const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, role = 'worker' } = req.body;
    
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    const db = getDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, fullName, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        const token = jwt.sign(
          { id: this.lastID, username, role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, username, fullName, role }
        });
      }
    );
    
    db.close();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDatabase();
    
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            role: user.role
          }
        });
      }
    );
    
    db.close();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
