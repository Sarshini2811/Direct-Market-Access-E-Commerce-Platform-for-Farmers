# AgriDirect — Direct Market Access & E-Commerce Platform for Farmers

A full-stack MERN marketplace connecting farmers directly with consumers, retailers,
restaurants and wholesalers. Built with React + Vite + Tailwind, Node/Express, and
MongoDB/Mongoose.

## What's implemented

- **Auth & roles**: JWT auth, bcrypt password hashing, role-based access control
  (`farmer`, `buyer`, `admin`), protected routes on both client and server.
- **Marketplace**: search, category/price/grade/verified filters, pagination, product
  detail pages, farmer public profiles.
- **Farmer module**: CRUD produce listings with images, stock, wholesale pricing,
  surplus/discount labeling, dashboard with revenue/best-seller charts (Recharts),
  inventory alerts.
- **Cart & checkout**: server-validated stock at every step, mock payment flow
  (clearly labeled, no real money moves) with a Razorpay-shaped integration boundary
  for production use.
- **Orders**: full lifecycle (`placed → accepted → packed → dispatched → delivered`,
  plus `cancelled`/`rejected`/`refunded`), stock reservation/release, status-based
  tracking (no fabricated GPS), printable order history.
- **Smart Harvest (pre-orders)**: farmers publish upcoming harvests with an
  *estimated* date; buyers reserve ahead of time; farmer confirms readiness, which
  auto-converts the pre-order into a live product listing; delay/update notifications.
- **Bulk orders & group buying**: wholesale minimums, group-buy creation/joining,
  target-vs-expiry finalization that only creates real orders once the target is
  actually met.
- **Price transparency**: comparison against real active listings, price trend
  derived strictly from completed platform transactions, sourced+dated external
  reference prices, and a clearly-labeled revenue estimator — never invented numbers.
- **Trust & moderation**: farmer verification workflow (admin-approved badges only),
  buyer reviews gated to real completed purchases, reporting + admin moderation.
- **Notifications**: polling-based (every 20s) as an honest stand-in for real-time
  infrastructure — no fake WebSocket behavior.
- **Admin dashboard**: live stats, user management, listing moderation, order
  monitoring, verification review, report resolution, audit log.
- **Analytics**: farmer revenue/best-sellers/completion-rate, admin
  registrations/order-volume/GMV/category distribution — computed from real stored
  data, not hardcoded.
- **Tests**: Jest + Supertest covering auth and the critical inventory-overselling
  guarantees (see "Running tests" below).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Lucide icons |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (httpOnly cookie + Bearer header), bcryptjs |
| Uploads | Multer (local disk by default; Cloudinary-ready) |
| Payments | Mock mode by default; Razorpay-shaped abstraction for production |

## Project structure

```
farmer-marketplace/
  client/                 # React + Vite frontend
    src/
      components/         # Navbar, Footer, ProductCard, route guards, shared UI
      context/             # AuthContext, CartContext
      layouts/              # PublicLayout, DashboardLayout (farmer/admin sidebar)
      pages/
        public/             # Landing, login/register, marketplace, product/preorder/groupbuy details
        buyer/               # Cart, checkout, orders, notifications, profile
        farmer/              # Dashboard, products, orders, pre-orders, price insights, verification
        admin/               # Dashboard, verifications, listings, orders, users, reports, audit log
      services/             # axios API clients, one module per domain
  server/                  # Express + MongoDB backend
    config/                # db connection, shared enums/constants
    controllers/           # one per domain (auth, product, order, preOrder, groupBuy, ...)
    middleware/            # auth/RBAC, error handler, validation runner, multer upload
    models/                # 15 Mongoose schemas
    routes/                # one router per domain, mounted under /api
    services/              # upload, payment, notification, audit, inventory abstractions
    validators/            # express-validator chains
    scripts/seed.js         # realistic demo data
    tests/                 # Jest + Supertest
  .env.example
```

## Getting started

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance — either local (`mongod` running on `27017`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 2. Backend setup

```bash
cd server
npm install
cp ../.env.example .env
# edit .env: at minimum set MONGO_URI and a real JWT_SECRET
npm run seed        # populates demo farmers, buyers, products, orders, pre-orders, group buys
npm run dev         # starts the API on http://localhost:5000
```

Demo accounts created by the seed script are printed to the console, and are also:

| Role | Email | Password |
|---|---|---|
| Admin | admin@farmmarket.demo | Admin@12345 |
| Farmer | murugan@farmmarket.demo | Farmer@12345 |
| Buyer | priya@buyer.demo | Buyer@12345 |

### 3. Frontend setup

```bash
cd client
npm install
npm run dev          # starts Vite on http://localhost:5173, proxied to the API
```

Open http://localhost:5173 — the marketplace, dashboards and demo accounts above are
ready to explore immediately.

### 4. Running tests

```bash
cd server
npm test
```

Tests use `mongodb-memory-server`, which downloads a MongoDB binary the **first**
time it runs (requires outbound internet access once; it's cached afterwards). If
your environment has no internet access, point the tests at a real local MongoDB
instead, or run them in CI/locally where the download is permitted.

## Configuration reference (`.env`)

All variables are documented in `.env.example` at the repo root — copy it to
`server/.env`. Key choices:

- **`UPLOAD_DRIVER`**: `local` (default, zero config, serves files from
  `server/uploads`) or `cloudinary` (requires `CLOUDINARY_*` keys — the integration
  boundary is in `server/services/uploadService.js` and throws a clear error if
  selected without credentials).
- **`PAYMENT_MODE`**: `mock` (default — simulates a successful payment, clearly
  labeled as a demo, no real money moves) or `razorpay` (requires `RAZORPAY_*` keys;
  the boundary is in `server/services/paymentService.js`, which verifies signatures
  server-side once wired up with real credentials).
- **`MONGO_URI`**: local or Atlas connection string.
- **`JWT_SECRET`**: replace the placeholder with a long random string before any
  real deployment.

## Design & honesty notes (per the project brief)

- Harvest dates on Smart Harvest listings are always presented as **estimates**;
  only a farmer-triggered "confirm harvest" action creates real, orderable stock.
- Order tracking is **status-based** (placed → accepted → packed → dispatched →
  delivered) — there is no fabricated live GPS tracking anywhere in the UI or API.
- Notifications are **polled** every 20 seconds rather than pretending to be
  real-time, since no WebSocket/Socket.IO infrastructure is configured.
- Price insights clearly separate **platform transaction data**, **external
  reference data** (with source + date), and **user-entered estimates** — the API
  and UI both label which is which, and return "no data available" rather than
  inventing numbers when a category has no history yet.
- Verification badges only appear after an **admin-approved** `VerificationRequest`
  — a farmer's self-reported profile fields never grant a badge on their own.
- Reviews can only be created against a `delivered` order the reviewing buyer
  actually placed (enforced both by controller logic and a unique compound index).
- Group buys only create real orders once the target is genuinely reached (or are
  marked `expired` with nothing charged) — never marked `fulfilled` prematurely.

## Known limitations / next steps for production

- Payments and Cloudinary uploads are integration-ready but intentionally left
  unwired without real credentials (see `services/paymentService.js` and
  `services/uploadService.js`) — this is a deliberate boundary, not an omission.
- Real-time updates (order status, notifications) would benefit from Socket.IO in
  place of polling for a production deployment.
- The seed script's historical order dates are synthetic (for chart demo purposes);
  in production, all trend charts read the same live collections with no seed
  dependency.
