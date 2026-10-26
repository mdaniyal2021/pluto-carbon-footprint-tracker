/**
 * Pluto Carbon Footprint Tracker
 * Database Initialization — NeDB (file-based, no server required)
 */

const Datastore = require('nedb-promises');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, 'data');

const db = {
  users:     Datastore.create({ filename: path.join(DB_DIR, 'users.db'),     autoload: true }),
  emissions: Datastore.create({ filename: path.join(DB_DIR, 'emissions.db'), autoload: true }),
  tips:      Datastore.create({ filename: path.join(DB_DIR, 'tips.db'),      autoload: true }),
};

// Seed default tips and an admin user on first run
async function seedDatabase() {
  const existingTips = await db.tips.find({});
  if (existingTips.length === 0) {
    await db.tips.insert([
      { category: 'travel',  title: 'Combine Trips',          body: 'Plan errands together to reduce the number of car journeys you make each week.',       type: 'personalised' },
      { category: 'travel',  title: 'Use Public Transport',   body: 'Buses and trains produce significantly fewer emissions per passenger than private cars.', type: 'personalised' },
      { category: 'travel',  title: 'Reduce Car Journeys',    body: 'Consider walking or cycling for shorter distances to cut transport emissions.',          type: 'personalised' },
      { category: 'energy',  title: 'Lower Heating Usage',    body: 'Reducing your thermostat by just 1°C can cut heating bills and emissions by up to 10%.', type: 'general' },
      { category: 'general', title: 'Eat Less Red Meat',      body: 'Beef and lamb production generates far more greenhouse gases than plant-based foods.',   type: 'general' },
      { category: 'general', title: 'Limit Gaming Time',      body: 'Gaming consoles and PCs consume significant energy — power them down when not in use.',  type: 'general' },
      { category: 'general', title: 'Choose Outdoor Activities', body: 'Outdoor activities like walking and cycling have virtually zero carbon footprint.',   type: 'general' },
    ]);
  }

  const existingAdmin = await db.users.findOne({ username: 'admin' });
  if (!existingAdmin) {
    const hash = await bcrypt.hash('Admin@1234', 10);
    await db.users.insert({
      username:  'admin',
      email:     'admin@pluto-cft.com',
      password:  hash,
      role:      'admin',
      joinedAt:  new Date().toISOString(),
    });
  }
}

// Demo data: ~6 months of sample emissions so the dashboard chart is populated.
// Dates are relative to today, so the chart always shows the last 6 months.
const DEMO_ACTIVITIES = [
  { category: 'travel',  activityType: 'car_petrol',      unit: 'km',  factor: 0.21,  min: 5,  max: 45 },
  { category: 'travel',  activityType: 'bus',             unit: 'km',  factor: 0.10,  min: 4,  max: 25 },
  { category: 'travel',  activityType: 'train',           unit: 'km',  factor: 0.04,  min: 10, max: 80 },
  { category: 'energy',  activityType: 'electricity',     unit: 'kWh', factor: 0.233, min: 3,  max: 14 },
  { category: 'energy',  activityType: 'gas_heating',     unit: 'kWh', factor: 0.202, min: 5,  max: 20 },
  { category: 'general', activityType: 'food_chicken',    unit: 'kg',  factor: 6.9,   min: 0.3, max: 1.2 },
  { category: 'general', activityType: 'food_vegetables', unit: 'kg',  factor: 2.0,   min: 0.5, max: 2.5 },
  { category: 'general', activityType: 'food_beef',       unit: 'kg',  factor: 27.0,  min: 0.2, max: 0.8 },
];

async function seedDemoEmissions(username) {
  const user = await db.users.findOne({ username });
  if (!user || await db.emissions.count({ userId: user._id }) > 0) return;

  let seed = username.length * 7919; // deterministic pseudo-random so every run looks the same
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const today   = new Date();
  const entries = [];
  for (let m = 5; m >= 0; m--) {
    const first = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const lastDay = m === 0
      ? today.getDate()
      : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

    for (let n = 0; n < 14; n++) {
      const a   = DEMO_ACTIVITIES[Math.floor(rand() * DEMO_ACTIVITIES.length)];
      const qty = parseFloat((a.min + rand() * (a.max - a.min)).toFixed(1));
      const day = 1 + Math.floor(rand() * lastDay);
      const date = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      entries.push({
        userId:       user._id,
        category:     a.category,
        activityType: a.activityType,
        quantity:     qty,
        unit:         a.unit,
        co2Kg:        parseFloat((a.factor * qty).toFixed(3)),
        date,
        notes:        'Demo data',
        createdAt:    new Date(`${date}T12:00:00`).toISOString(),
      });
    }
  }
  await db.emissions.insert(entries);
}

async function seedDemoData() {
  const existingDemo = await db.users.findOne({ username: 'demo' });
  if (!existingDemo) {
    await db.users.insert({
      username:  'demo',
      email:     'demo@pluto-cft.com',
      password:  await bcrypt.hash('Demo@1234', 10),
      role:      'user',
      joinedAt:  new Date().toISOString(),
    });
  }
  await seedDemoEmissions('demo');
  await seedDemoEmissions('admin');
}

seedDatabase().then(seedDemoData).catch(console.error);

module.exports = db;
