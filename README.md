# Expenso — Expense Analytics System

A complete, production-style personal finance web app: track income & expenses, set budgets, and analyze spending with real charts. Built with a **vanilla HTML/CSS/JavaScript** frontend and a **Node.js + Express + MongoDB** backend. No frontend framework.

---

## Features

- **Authentication** — Register / Login / Logout with JWT + bcrypt password hashing, protected routes, per-user data isolation.
- **Dashboard** — Total balance, income, expenses, savings, month-over-month comparison, recent transactions, budget overview, insights, and charts.
- **Transactions / Expenses / Income** — Full CRUD with search, category / type / payment-method filters, date range, min–max amount, sorting, and pagination.
- **Categories** — Default categories seeded per user, plus custom categories (icon, type, description).
- **Budgets** — Monthly per-category budgets with spent / remaining / percentage, progress bars, and 80% / 100% / over-budget warnings computed from real transactions.
- **Analytics** — This week / month / last month / 3 / 6 months / year / custom range. Category donut, income-vs-expense bar, spending trend line, top-category bar, and a full statistics panel. Powered by MongoDB aggregation.
- **Reports** — Monthly expense, monthly income, income-vs-expense, category, payment-method, and budget reports with **CSV export**.
- **Profile & Settings** — Update name & currency, choose date format, default dashboard period, and light/dark theme.
- **UX** — Responsive sidebar + mobile drawer, loading spinners, empty states, error states, toasts, and confirmation dialogs.

---

## Technology Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), `fetch()`, Chart.js (via CDN).
**Backend:** Node.js, Express.js.
**Database:** MongoDB with Mongoose.
**Auth:** JSON Web Tokens, bcryptjs.

---

## Architecture

```
Browser (HTML + vanilla JS)  ──fetch()──►  Express REST API
                                              ├─ routes/        (endpoint wiring)
                                              ├─ controllers/   (request handling + validation)
                                              ├─ middleware/    (JWT auth, error handling)
                                              ├─ models/        (Mongoose schemas)
                                              └─ utils/         (token, period, async wrapper)
                                                        │
                                                        ▼
                                                    MongoDB
```

The backend also **serves the static client**, so one server runs the whole app.

---

## Folder Structure

```
expense-analytics/
├── client/                 # Vanilla JS frontend (served statically by Express)
│   ├── *.html              # login, register, dashboard, transactions, expenses, income,
│   │                       # analytics, budgets, reports, categories, profile, settings, 404
│   ├── css/app.css         # Single responsive stylesheet (light/dark)
│   └── js/
│       ├── api.js          # fetch() wrapper (adds JWT, handles 401)
│       ├── app.js          # shell, auth guard, toast, modal, formatting helpers
│       ├── txn.js          # shared transaction list view
│       └── <page>.js       # one script per page
├── server/
│   ├── config/db.js        # Mongoose connection
│   ├── models/             # User, Transaction, Category, Budget
│   ├── middleware/         # auth.js, error.js
│   ├── controllers/        # auth, transaction, category, budget, analytics
│   ├── routes/             # auth, transactions, expenses, income, categories, budgets, analytics
│   ├── utils/              # token.js, period.js, ah.js
│   ├── seed/seed.js        # demo user + 6 months of sample data
│   └── server.js
├── .env.example
├── .gitignore
├── package.json            # root convenience scripts
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** running locally (or a MongoDB Atlas connection string)

### MongoDB setup

Local (default): install MongoDB Community Server and ensure it listens on `mongodb://127.0.0.1:27017`.
Atlas: create a free cluster and copy its connection string into `MONGODB_URI`.

---

## Environment Variables

Copy `.env.example` to `server/.env` and fill in values:

| Variable       | Description                                   | Example |
|----------------|-----------------------------------------------|---------|
| `PORT`         | Port the server listens on                    | `5000` |
| `MONGODB_URI`  | MongoDB connection string                     | `mongodb://127.0.0.1:27017/expense_analytics` |
| `JWT_SECRET`   | Secret used to sign JWTs (use a long random string) | `a-very-long-random-string` |
| `JWT_EXPIRES`  | Token lifetime                                | `7d` |
| `NODE_ENV`     | `development` or `production`                  | `development` |

`JWT_SECRET` is your own random string. `MONGODB_URI` comes from your local MongoDB or Atlas.

---

## Installation & Running

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Configure environment
cp ../.env.example .env        # then edit .env (Windows: copy ..\.env.example .env)

# 3. (Optional) Seed demo data — creates demo@expense.app / demo1234 with 6 months of data
npm run seed

# 4. Start the server (serves API + frontend)
npm start                      # or: npm run dev  (auto-reload via nodemon)
```

Then open **http://localhost:5000** in your browser.

Alternatively, from the project root you can use the convenience scripts:

```bash
npm run install:server   # cd server && npm install
npm run seed             # cd server && npm run seed
npm start                # cd server && npm start
```

### Demo login
After seeding: **email** `demo@expense.app` · **password** `demo1234`.

---

## API Overview

All `/api` routes except register/login require an `Authorization: Bearer <token>` header.

```
POST   /api/auth/register        POST   /api/auth/login       GET /api/auth/me      PUT /api/auth/me
GET/POST/PUT/DELETE  /api/transactions[/:id]
GET/POST/PUT/DELETE  /api/expenses[/:id]        (type forced to "expense")
GET/POST/PUT/DELETE  /api/income[/:id]          (type forced to "income")
GET/POST/PUT/DELETE  /api/categories[/:id]
GET/POST/PUT/DELETE  /api/budgets[/:id]
GET /api/analytics/summary | categories | monthly | trends | income-vs-expenses
GET /api/health
```

Transactions accept query params: `page, limit, sortBy, order, search, type, category, paymentMethod, startDate, endDate, minAmount, maxAmount`.
Analytics accept: `period` (`week|month|last-month|3m|6m|year|custom`) and, for custom, `startDate` & `endDate`.

---

## How the frontend is served

The Express server serves the `client/` folder statically (`express.static`) and returns `404.html` for unknown paths. There is **no separate frontend server or build step** — just start the backend and browse to the port.

---

## Screenshots

_Add screenshots of the dashboard, analytics, and budgets pages here._

---

## Troubleshooting

- **"Network error – server not running"** in the UI → the backend isn't up; start it with `npm start`.
- **`MongoServerError` / connection failed** → MongoDB isn't running or `MONGODB_URI` is wrong.
- **Blank page / 401 loops** → clear the stored token (log out) and log in again; ensure `JWT_SECRET` is set.
- **Charts not visible** → Chart.js loads from a CDN; an internet connection is required for the CDN, or self-host `chart.umd.min.js`.

---

## Future Improvements

Recurring transactions, multi-currency conversion, budget rollover, email reports, data import (CSV/bank), and 2FA.
