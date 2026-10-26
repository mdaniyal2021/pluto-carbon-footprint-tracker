# Pluto — Carbon Footprint Tracker

A web app that lets users log everyday activities (travel, energy, food), converts them into kg of CO₂, and shows their footprint on a personal dashboard with a six-month trend chart and eco tips.

Built with **Node.js**, **Express** and a file-based **NeDB** database. No database server is needed.

## Screenshots

| Login | Dashboard |
|-------|-----------|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Emission Log | Tips & FAQ |
|--------------|------------|
| ![Emission log](docs/screenshots/emission-log.png) | ![Tips](docs/screenshots/tips.png) |

## Features

- Sign up and log in with username or email; passwords hashed with bcrypt
- Server-side sessions with 24-hour expiry
- Log activities across travel, energy and food, with automatic CO₂ calculation
- Entry list with date filter and per-entry delete (scoped to the owner)
- Dashboard: total, last 7 days, this month, highest-emitting category, lowest-emission day
- Six-month emissions trend chart (Chart.js)
- Personalised and general eco tips plus an FAQ
- Demo data seeded on first run so the dashboard is never empty

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | HTML5, CSS3, vanilla JavaScript               |
| Backend  | Node.js 18+, Express 5                        |
| Database | NeDB (`nedb-promises`, file-based)            |
| Auth     | bcryptjs + express-session                    |
| Charts   | Chart.js (CDN)                                |

## Pages

| Page         | Route             | Description                             |
|--------------|-------------------|-----------------------------------------|
| Login        | `/auth/login`     | User authentication                     |
| Sign Up      | `/auth/signup`    | New account registration                |
| Dashboard    | `/dashboard`      | Stats, monthly chart, insights          |
| Emission Log | `/emissions/log`  | Log activities, view and delete entries |
| Tips         | `/dashboard/tips` | Personalised and general tips + FAQ     |

## Getting Started

Requires [Node.js](https://nodejs.org) v18 or newer.

```bash
git clone <your-repo-url>
cd pluto-cft
npm install
npm start
```

Open <http://localhost:3000>. The database files in `db/data/` are created and seeded automatically on first start.

To use a different port:

```bash
# macOS / Linux
PORT=4000 npm start

# Windows PowerShell
$env:PORT=4000; npm start
```

### Demo accounts

These are seeded locally for demonstration only:

| Username | Password    | Notes                          |
|----------|-------------|--------------------------------|
| `demo`   | `Demo@1234` | Regular user with 6 months of sample data |
| `admin`  | `Admin@1234`| Seeded admin account           |

You can also create your own account from the Sign Up page.

### Configuration

| Variable         | Purpose                                                        |
|------------------|----------------------------------------------------------------|
| `PORT`           | Port to listen on (default `3000`)                             |
| `SESSION_SECRET` | Secret used to sign session cookies. If unset, a random one is generated on each start (sessions reset on restart). |

See `.env.example`.

## Database

Three collections stored as flat files in `db/data/` (git-ignored):

- **users** — `username`, `email`, `password` (hashed), `role`, `joinedAt`
- **emissions** — `userId`, `category`, `activityType`, `quantity`, `unit`, `co2Kg`, `date`, `notes`
- **tips** — `category`, `title`, `body`, `type` (personalised / general)

## Project Structure

```
pluto-cft/
├── server.js           # Express entry point
├── db/
│   └── database.js     # DB init and seeding
├── routes/
│   ├── auth.js         # Login, signup, logout
│   ├── emissions.js    # Emission CRUD + emission factors
│   └── dashboard.js    # Stats and tips
├── public/
│   ├── css/style.css   # Global stylesheet
│   └── pages/          # HTML pages
└── docs/screenshots/   # README images
```

## Design Notes

- **NeDB** keeps setup to `npm install` and `npm start`, with no database server.
- Emission calculation uses a fixed table of emission factors per activity type (petrol/diesel car, bus, train, short flight, electricity, gas heating, beef, chicken, vegetables).
- All emission queries are filtered by the logged-in user's ID.

## Known Limitations

This is a demo/portfolio project, not production-ready:

- Sessions use the default in-memory store, so they reset on restart.
- No rate limiting or CSRF protection on the auth endpoints.
- Input validation is minimal.
- NeDB is not suited to heavy concurrent writes.

## License

MIT — see [LICENSE](LICENSE).
