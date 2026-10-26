/**
 * Pluto Carbon Footprint Tracker
 * Main Server Entry Point
 */

const express        = require('express');
const session        = require('express-session');
const path           = require('path');

const authRoutes      = require('./routes/auth');
const emissionRoutes  = require('./routes/emissions');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  // Set SESSION_SECRET in the environment; falls back to a random per-start secret
  secret:            process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',      authRoutes);
app.use('/emissions', emissionRoutes);
app.use('/dashboard', dashboardRoutes);

// Redirect root to login
app.get('/', (req, res) => {
  res.redirect(req.session.userId ? '/dashboard' : '/auth/login');
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile('404.html', { root: './public/pages' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🌿  Pluto CFT running at http://localhost:${PORT}\n`);
});
