# PerforMetrix AI Audit

A standalone maturity diagnostic web app for CHROs, under the PerforMetrix brand. Completely separate from any other app — its own URL, database, and auth system.

## What it does

A CHRO clicks a link from your email outreach, arrives at the portal, creates an account with email and password, takes the 15-question AI maturity diagnostic (about 10 minutes), and receives a detailed, visually rich report showing:

- Overall maturity score (0-100) and band
- Scores for five dimensions: Vision and strategy, Criteria and goals, Manager capability, Accountability and guardrails, Culture and trust
- Per-dimension maturity band (Ad hoc / Reactive / Building / Embedded / Leading) with a prescriptive next step

You (the admin) can log in to see who signed up, who took the survey, and view their reports.

## Setup

### Prerequisites

Node.js v20+. No external API keys required (Supabase, Resend, etc. are not used).

### Installation

```bash
cd "C:\Vibe Coded Projects\PerforMetrix AI Audit"
npm install
```

### Running

```bash
npm start
```

The app runs at `http://localhost:3000`.

### Admin account

Create an admin account by setting environment variables:

```bash
set ADMIN_EMAIL=admin@yourorg.com
set ADMIN_PASSWORD=securepassword123
set ADMIN_NAME=Your Name
npm start
```

If you don't set these, the first person to sign up gets a `chro` account only. To access `/admin`, either seed an admin account or manually edit `data/db.json` to change a user's role to `admin`.

### Data storage

All data is stored in `data/db.json` — a simple JSON file. No external database required. Back up this file to preserve signups and reports.

## Architecture

- **Server:** Express.js
- **Auth:** Express sessions with bcrypt password hashing
- **Database:** JSON file (`data/db.json`)
- **Views:** EJS templates
- **Styling:** Custom CSS matching the PerforMetrix brand (dark ink theme, brass accents, Fraunces/Inter typefaces)
- **Deployment:** Any Node.js hosting platform

## Survey

15 behaviour-based questions across five dimensions, mixed together in random order (no dimension headers visible during the survey). Each question asks "How common?" on a 1-5 scale (Never → Always).

The report clusters responses back under dimension headings with per-dimension scores, bands, and next steps. An overall composite score (mean of the five dimensions) tracks progress over time.
