/**
 * Pluto Carbon Footprint Tracker
 * Emissions Routes — Log, View, Delete Emission Entries
 */

const express = require('express');
const db      = require('../db/database');
const router  = express.Router();

// Emission factors (kg CO2 per unit)
const EMISSION_FACTORS = {
  car_petrol:      0.21,   // per km
  car_diesel:      0.17,   // per km
  bus:             0.10,   // per km
  train:           0.04,   // per km
  flight_short:    0.255,  // per km
  electricity:     0.233,  // per kWh
  gas_heating:     0.202,  // per kWh
  food_beef:       27.0,   // per kg
  food_chicken:    6.9,    // per kg
  food_vegetables: 2.0,    // per kg
};

// Middleware — require authentication
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  next();
}

// GET /emissions/log — serve page
router.get('/log', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.sendFile('emission-log.html', { root: './public/pages' });
});

// GET /emissions/api/list?date=YYYY-MM-DD
router.get('/api/list', requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.session.userId };
    if (date) query.date = date;

    const entries = await db.emissions.find(query).sort({ createdAt: -1 });
    const total   = entries.reduce((sum, e) => sum + e.co2Kg, 0);

    res.json({ success: true, entries, total: parseFloat(total.toFixed(3)) });
  } catch (err) {
    console.error('List emissions error:', err);
    res.json({ success: false, message: 'Could not retrieve entries.' });
  }
});

// POST /emissions/api/add
router.post('/api/add', requireAuth, async (req, res) => {
  try {
    const { category, activityType, quantity, unit, date, notes } = req.body;

    if (!category || !activityType || !quantity || !date) {
      return res.json({ success: false, message: 'All required fields must be filled.' });
    }

    const factor = EMISSION_FACTORS[activityType] || 0;
    const co2Kg  = parseFloat((factor * parseFloat(quantity)).toFixed(3));

    const entry = await db.emissions.insert({
      userId:       req.session.userId,
      category,
      activityType,
      quantity:     parseFloat(quantity),
      unit:         unit || '',
      co2Kg,
      date,
      notes:        notes || '',
      createdAt:    new Date().toISOString(),
    });

    res.json({ success: true, entry });
  } catch (err) {
    console.error('Add emission error:', err);
    res.json({ success: false, message: 'Could not save entry.' });
  }
});

// DELETE /emissions/api/delete/:id
router.delete('/api/delete/:id', requireAuth, async (req, res) => {
  try {
    const removed = await db.emissions.remove(
      { _id: req.params.id, userId: req.session.userId },
      {}
    );
    if (removed === 0) return res.json({ success: false, message: 'Entry not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete emission error:', err);
    res.json({ success: false, message: 'Could not delete entry.' });
  }
});

// GET /emissions/api/factors — return emission factors for frontend
router.get('/api/factors', (req, res) => {
  res.json({ success: true, factors: EMISSION_FACTORS });
});

module.exports = router;
