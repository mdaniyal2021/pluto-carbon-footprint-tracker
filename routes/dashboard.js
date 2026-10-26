/**
 * Pluto Carbon Footprint Tracker
 * Dashboard & Tips Routes
 */

const express = require('express');
const db      = require('../db/database');
const router  = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
}

// GET /dashboard
router.get('/', requireAuth, (req, res) => {
  res.sendFile('dashboard.html', { root: './public/pages' });
});

// GET /dashboard/api/stats — summary stats for logged-in user
router.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const userId  = req.session.userId;
    const user    = await db.users.findOne({ _id: userId });
    const all     = await db.emissions.find({ userId });

    const totalCo2      = all.reduce((s, e) => s + e.co2Kg, 0);
    const totalEntries  = all.length;

    // Last 7 days total
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7 = all.filter(e => new Date(e.date) >= sevenDaysAgo);
    const last7Co2 = last7.reduce((s, e) => s + e.co2Kg, 0);

    // This month total
    const now = new Date();
    const thisMonth = all.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthCo2 = thisMonth.reduce((s, e) => s + e.co2Kg, 0);

    // Highest category
    const categoryTotals = {};
    all.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.co2Kg;
    });
    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    // Best day (lowest non-zero)
    const byDay = {};
    all.forEach(e => {
      byDay[e.date] = (byDay[e.date] || 0) + e.co2Kg;
    });
    const bestDay = Object.entries(byDay).sort((a, b) => a[1] - b[1])[0];

    // Monthly breakdown for chart (last 6 months)
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }
    all.forEach(e => {
      const key = e.date.substring(0, 7);
      if (monthlyData.hasOwnProperty(key)) monthlyData[key] += e.co2Kg;
    });

    res.json({
      success: true,
      user: { username: user.username, email: user.email, joinedAt: user.joinedAt },
      stats: {
        totalCo2:        parseFloat(totalCo2.toFixed(2)),
        totalEntries,
        last7Co2:        parseFloat(last7Co2.toFixed(2)),
        thisMonthCo2:    parseFloat(thisMonthCo2.toFixed(2)),
        highestCategory: highestCategory ? { name: highestCategory[0], co2: parseFloat(highestCategory[1].toFixed(2)) } : null,
        bestDay:         bestDay         ? { date: bestDay[0],         co2: parseFloat(bestDay[1].toFixed(2))         } : null,
        monthlyData,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.json({ success: false, message: 'Could not load stats.' });
  }
});

// GET /tips
router.get('/tips', requireAuth, (req, res) => {
  res.sendFile('tips.html', { root: './public/pages' });
});

// GET /tips/api/list
router.get('/tips/api/list', requireAuth, async (req, res) => {
  try {
    const tips = await db.tips.find({});
    const personalised = tips.filter(t => t.type === 'personalised');
    const general      = tips.filter(t => t.type === 'general');
    res.json({ success: true, personalised, general });
  } catch (err) {
    res.json({ success: false, message: 'Could not load tips.' });
  }
});

module.exports = router;
