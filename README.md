# Present Hoon Sir! (PHS-AMS)

**QR Code Attendance Management System for Colleges & Universities**

Present Hoon Sir! (PHS-AMS) replaces manual roll calls with a simple scan. Admins generate a time-boxed QR code for a class session, students scan it with their phone to mark their own attendance, and admins get instant reports, exports, and defaulter lists — no hardware, no paper registers.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Frontend Routes](#frontend-routes)
- [User Roles](#user-roles)
- [Core Workflows](#core-workflows)
- [Scripts](#scripts)

---

## Features

- **QR-based self check-in** — Admin generates a QR code valid for 5 minutes; students scan it on their own device to mark themselves present.
- **Manual attendance editing** — Admins can view and override attendance for any date (mark all present/absent, edit individual students).
- **Batch management** — Create batches, assign one or more collaborating admins to a batch.
- **Student management** — Add students individually or via bulk CSV/Excel import, edit, delete, and blacklist students (blacklisted students can't submit QR attendance).
- **Reports & analytics** — Per-batch and per-student attendance reports, good-standing vs. defaulter lists, attendance percentage matrix, pie-chart visualizations.
- **Exports** — Download attendance reports as PDF or Excel, for a whole batch or a custom date range.
- **Dashboard "not marked" alert** — Dashboard & Reports flag when today's attendance hasn't been taken yet, with a one-click shortcut to the Generate QR page.
- **Device-level abuse prevention** — QR submissions are rate-limited per device (cooldown window) to deter students from marking attendance for absent classmates.
- **Role-based access** — `super_admin` (full control, manage other admins) vs. `admin` (manage assigned batches/students).
- **Public student-facing scan page** — No login required for students; they just open the QR link/scan the code and submit their name/URN.

---

## Tech Stack

### Frontend
- **React 18** + **Vite** — SPA build tooling
- **React Router v6** — client-side routing
- **Tailwind CSS 3** — utility-first styling (custom "paper ledger" design theme)
- **jsPDF** + **jspdf-autotable** — client-side PDF report generation
- **xlsx (SheetJS)** — Excel import/export

### Backend
- **Node.js** + **Express 5** — REST API server
- **PostgreSQL** (`pg` driver) — relational database
- **JWT (jsonwebtoken)** — stateless auth tokens
- **bcrypt** — password hashing
- **qrcode** — QR code image generation
- **uuid** — session/device token generation
- **CORS** — configured allow-list for frontend origin(s)

---

## Project Structure

```
Zip Folder/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # PostgreSQL connection pool
│   │   │   └── schema.sql            # Full DB schema (tables, indexes)
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login, change password
│   │   │   ├── adminController.js    # CRUD for admin accounts
│   │   │   ├── batchController.js    # CRUD for batches, admin assignment
│   │   │   ├── studentController.js  # CRUD + blacklist for students
│   │   │   ├── qrController.js       # QR session generation, submission, download
│   │   │   ├── attendanceController.js # Get/save attendance for a date
│   │   │   └── reportController.js   # Batch/student reports, attendance matrix
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification + role guard
│   │   ├── routes/                   # Express routers (one per resource)
│   │   └── index.js                  # App entry point, route mounting, CORS
│   ├── check-*.js, migrate-*.js      # One-off DB inspection/migration scripts
│   ├── test-*.js                     # Manual API test scripts
│   ├── seed-superadmin.js            # Script to seed the first super_admin
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js             # Centralized fetch wrapper + all API calls
    │   ├── components/
    │   │   ├── Layout.jsx            # Authenticated app shell (header + nav)
    │   │   ├── ProtectedRoute.jsx    # Route guard (redirects to /login if unauth'd)
    │   │   ├── Logo.jsx              # Reusable brand logo component
    │   │   └── AttendancePie.jsx     # Pie chart visualization
    │   ├── context/
    │   │   └── AuthContext.jsx       # Auth state (token, admin info) provider
    │   ├── hooks/
    │   │   └── useSelectedBatch.js   # Persisted "currently selected batch" hook
    │   ├── pages/
    │   │   ├── Landing.jsx           # Public marketing/landing page
    │   │   ├── Login.jsx             # Admin login
    │   │   ├── Dashboard.jsx         # Batch overview, today's stats
    │   │   ├── AddBatch.jsx          # Create batch + bulk student import
    │   │   ├── Students.jsx          # Student list, add/edit/delete/blacklist
    │   │   ├── GenerateQr.jsx        # Generate & display live QR session
    │   │   ├── ScanAttendance.jsx    # Public student-facing scan/submit page
    │   │   ├── EditAttendance.jsx    # Manual attendance override for a date
    │   │   ├── Reports.jsx           # Reports, exports, defaulter lists
    │   │   └── ManageAdmins.jsx      # Super-admin: manage admin accounts
    │   ├── App.jsx                   # Route definitions
    │   ├── main.jsx                  # React entry point
    │   └── index.css                 # Global styles, Tailwind directives
    ├── public/                       # robots.txt, sitemap.xml, static assets
    ├── index.html                    # HTML shell, meta/SEO tags
    ├── tailwind.config.js            # Design tokens (colors, fonts)
    └── package.json
```

---

## Architecture Overview

```
┌─────────────────┐        HTTPS / REST (JSON)        ┌──────────────────┐
│                 │ ─────────────────────────────────> │                  │
│  React Frontend │                                     │  Express Backend │
│  (Vite + React  │ <───────────────────────────────── │  (Node.js)       │
│   Router)       │        JWT-authenticated            │                  │
└─────────────────┘                                     └────────┬─────────┘
                                                                   │
                                                                   │ pg (node-postgres)
                                                                   ▼
                                                          ┌──────────────────┐
                                                          │   PostgreSQL     │
                                                          └──────────────────┘
```

- The frontend is a single-page app; all data comes from the backend's REST API via `frontend/src/api/client.js`.
- Auth is stateless JWT stored client-side (via `AuthContext`); the token is sent as a `Bearer` header on every authenticated request.
- The student-facing QR scan page (`/scan/:token`) and its submit endpoint are the only public, unauthenticated surfaces — everything else requires an admin JWT.

---

## Database Schema

Defined in `backend/src/config/schema.sql`. Core tables:

| Table | Purpose |
|---|---|
| `admins` | Admin accounts. `role` is either `super_admin` or `admin`. |
| `batches` | A class/section/batch of students. Tracks `created_by`. |
| `batch_admins` | Many-to-many join — which admins can manage which batch (collaboration). |
| `students` | Student records, tied to a `batch_id`. Includes `is_blacklisted` flag. |
| `qr_sessions` | One row per "Generate QR" activation — has a unique `session_token` and `expires_at` (5-minute validity). |
| `attendance` | One row per student per date. `status` (`present`/`absent`), `method` (`qr`/`manual`). `UNIQUE(student_id, date)` — this is the source of truth for "has attendance been marked today." |
| `qr_submissions` | Log of every scan/submit attempt, keyed by `device_token` — used to enforce a per-device submission cooldown and deter proxy attendance. |

> **Note:** `getAttendanceForDate` returns `status: 'absent'` (via `COALESCE`) for any student with no attendance row yet for the given date. Because of this, the only reliable way to detect "attendance not yet marked for today" on the frontend is checking whether **any** student has a non-null `method` — not their `status`.

---

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- PostgreSQL database (local or hosted, e.g. Render/Supabase/Neon)

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up the database

Create a PostgreSQL database, then run the schema:

```bash
psql "<your-connection-string>" -f backend/src/config/schema.sql
```

### 3. Configure environment variables

Create `backend/.env` (see [Environment Variables](#environment-variables) below).

### 4. Seed the first super admin

```bash
cd backend
node seed-superadmin.js
```

### 5. Run the app

```bash
# Terminal 1 — backend (default port 5000)
cd backend
npm run dev

# Terminal 2 — frontend (default port 3000/5173 depending on Vite config)
cd frontend
npm run dev
```

Visit the frontend URL in your browser, log in with the seeded super admin credentials, and start creating batches.

---

## Environment Variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (defaults to `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `NODE_ENV` | `development` / `production` |
| `FRONTEND_URL` | Deployed frontend origin, added to the CORS allow-list (in addition to `http://localhost:3000` which is always allowed for local dev) |

> `.env` is not committed — create it yourself locally, and set the same variables in your hosting provider's dashboard (e.g. Render) for production.

---

## API Routes

All routes are prefixed with `/api`. Routes marked 🔒 require a valid JWT (`Authorization: Bearer <token>`); 🔒🔒 additionally require `super_admin` role.

### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Admin login, returns JWT |
| POST | `/change-password` 🔒 | Change own password |

### Admins (`/api/admins`)
| Method | Path | Description |
|---|---|---|
| GET | `/basic` 🔒 | Lightweight admin list (id + name), used for batch-collaborator picker |
| GET | `/` 🔒🔒 | List all admins |
| POST | `/` 🔒🔒 | Create admin |
| PUT | `/:id` 🔒🔒 | Update admin |
| DELETE | `/:id` 🔒🔒 | Delete admin |

### Batches (`/api/batches`)
| Method | Path | Description |
|---|---|---|
| GET | `/` 🔒 | List batches (scoped to admin, unless super_admin) |
| POST | `/` 🔒 | Create batch |
| DELETE | `/:id` 🔒 | Delete batch |
| POST | `/:id/assign-admin` 🔒🔒 | Assign a collaborating admin to a batch |

### Students (`/api/students`)
| Method | Path | Description |
|---|---|---|
| GET | `/batch/:batchId` 🔒 | List students in a batch |
| POST | `/batch/:batchId` 🔒 | Add a student |
| PUT | `/:studentId` 🔒 | Update a student |
| DELETE | `/:studentId` 🔒 | Delete a student |
| PATCH | `/:studentId/blacklist` 🔒 | Toggle blacklist status (`admin` or `super_admin`) |

### QR (`/api/qr`)
| Method | Path | Description |
|---|---|---|
| POST | `/batch/:batchId/generate` 🔒 | Start a new QR session (5-min expiry) |
| GET | `/:sessionId/report` 🔒 | Get live submission report for a session |
| GET | `/:sessionId/download` 🔒 | Download session report |
| GET | `/:token/status` | **Public** — session status (used by scan page) |
| POST | `/:token/submit` | **Public** — student submits attendance via QR |

### Attendance (`/api/attendance`)
| Method | Path | Description |
|---|---|---|
| GET | `/batch/:batchId?date=YYYY-MM-DD` 🔒 | Get attendance for a batch on a given date |
| POST | `/batch/:batchId` 🔒 | Save/overwrite attendance for a batch on a given date |

### Reports (`/api/reports`)
| Method | Path | Description |
|---|---|---|
| GET | `/batch/:batchId` 🔒 | Batch report (good standing / defaulters) |
| GET | `/batch/:batchId/matrix` 🔒 | Full attendance percentage matrix |
| GET | `/student/:studentId` 🔒 | Individual student's attendance history |

---

## Frontend Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/scan/:token` | ScanAttendance | Public (student-facing) |
| `/dashboard` | Dashboard | Protected |
| `/batches/new` | AddBatch | Protected |
| `/students` | Students | Protected |
| `/generate-qr` | GenerateQr | Protected |
| `/edit-attendance` | EditAttendance | Protected |
| `/reports` | Reports | Protected |
| `/admins` | ManageAdmins | Protected (super_admin only, enforced in-page) |

"Protected" routes are wrapped in `<ProtectedRoute>`, which redirects unauthenticated users to `/login`, and `<Layout>`, which renders the shared header/nav shell.

---

## User Roles

| Role | Capabilities |
|---|---|
| **super_admin** | Everything an `admin` can do, plus: create/edit/delete other admin accounts, assign admins to batches |
| **admin** | Manage their assigned batch(es): students, QR generation, manual attendance edits, view reports |

---

## Core Workflows

### 1. Marking attendance via QR
1. Admin opens **Generate QR**, selects a batch, clicks **Generate QR**.
2. Backend creates a `qr_sessions` row with a unique token, valid for 5 minutes.
3. Students scan the QR (or open the link) → lands on the public `/scan/:token` page.
4. Student submits their identity → backend validates the session hasn't expired, the student isn't blacklisted, and the device hasn't exceeded its submission cooldown → writes an `attendance` row (`method: 'qr'`).
5. Admin's Generate QR page polls the live submission report to show who's checked in in real time.

### 2. Manual attendance
1. Admin opens **Edit Attendance**, picks a batch and date.
2. Marks each student present/absent individually, or uses "Mark All Present/Absent".
3. Saves → backend upserts `attendance` rows for that date (`method: 'manual'`).

### 3. "Attendance Not Marked" alert
- Dashboard and Reports check whether **any** student for the selected batch has a non-null `method` for today.
- If not, a banner appears: **"Attendance Not Marked for Today"** with a **"Mark Attendance →"** button that navigates straight to `/generate-qr`.
- Absent-student lists and "Absent Today" stats are suppressed while attendance is unmarked, to avoid showing misleading default-absent data.

### 4. Reports & exports
- Reports page shows per-batch attendance percentage, defaulters (below a threshold) vs. good standing.
- Exportable as PDF (via `jsPDF`) or Excel (via `xlsx`), for the whole batch or a custom date range.

---

## Scripts

### Backend (`backend/`)
| Script | Purpose |
|---|---|
| `npm run dev` | Run server with `nodemon` (auto-restart on change) |
| `npm start` | Run server with plain `node` |
| `node seed-superadmin.js` | Create the first super_admin account |
| `node check-*.js` | One-off scripts to inspect DB tables/schema during development |
| `node migrate-*.js` | One-off migration scripts (e.g. adding columns, timestamp fixes) |
| `node test-*.js` | Manual scripts exercising specific API flows (login, CRUD, QR, reports) end-to-end against a running server |

### Frontend (`frontend/`)
| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |

---

## Design System

The UI follows a "paper ledger" aesthetic — parchment background, forest green / brick red / amber accents, Fraunces serif for headings, IBM Plex Mono for labels/data, with a torn-perforated-edge motif on ticket-like elements (QR session card, danger zones). Design tokens (colors, fonts) live in `frontend/tailwind.config.js`.

---

## License

ISC (see `backend/package.json`).
