/**
 * Pluto Carbon Footprint Tracker
 * Authentication Routes — Login, Sign Up, Logout
 */

const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db/database');
const router  = express.Router();

// GET /auth/login
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.sendFile('login.html', { root: './public/pages' });
});

// GET /auth/signup
router.get('/signup', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.sendFile('signup.html', { root: './public/pages' });
});

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.json({ success: false, message: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return res.json({ success: false, message: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return res.json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await db.users.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.json({ success: false, message: 'Username or email already in use.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await db.users.insert({
      username,
      email,
      password: hash,
      role:     'user',
      joinedAt: new Date().toISOString(),
    });

    req.session.userId   = user._id;
    req.session.username = user.username;
    res.json({ success: true, redirect: '/dashboard' });
  } catch (err) {
    console.error('Signup error:', err);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: 'Username and password are required.' });
    }

    const user = await db.users.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      return res.json({ success: false, message: 'Invalid username or password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ success: false, message: 'Invalid username or password.' });
    }

    req.session.userId   = user._id;
    req.session.username = user.username;
    res.json({ success: true, redirect: '/dashboard' });
  } catch (err) {
    console.error('Login error:', err);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
});

module.exports = router;
