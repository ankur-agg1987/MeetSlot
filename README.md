# CDC MeetSlot — Career Advisory Session Booking

A booking platform for the Career Development Center: 10 advisors each get a
login to manage their own availability, and 1 master admin manages the
advisor accounts. Students need no login at all — they pick an advisor from
the homepage, fill in their details, and book a slot. The advisor gets an
email with the student's details, and the student gets a confirmation email.

## How accounts work

- **Master Admin** (1 login): creates/edits the 10 advisor profiles — name,
  designation, bio, and the Gmail address where that advisor receives
  booking notifications. Can also view every booking across all advisors.
- **Advisor** (10 logins, pre-seeded): logs in to set their weekly
  availability, create session types (e.g. "Resume Review — 30 min"), and
  see their own upcoming bookings.
- **Student**: no account. Visits the homepage, picks an advisor, picks a
  session type and time slot, fills in a short form (name, student ID,
  email, phone, program, purpose), and books.

## How notifications work (no Google Cloud needed)

Booking emails are sent through a single Gmail account using an **App
Password** — a simple 16-character code Google generates for you, no
developer console or OAuth setup required. See Part 5 of the deployment
guide for the 2-minute setup.

## Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT auth (bcrypt for
  passwords), Nodemailer for email, Luxon for timezone-safe scheduling.
- **Frontend**: React 18 + Vite, React Router, Axios.
- **Free hosting**: MongoDB Atlas (free M0 cluster) + Render (free backend)
  + Vercel (free frontend).

## Project structure

```
calendly-clone/
  backend/     Express API (Node) + seed.js to create the 11 accounts
  frontend/    React app (Vite)
```

---

## Quick local setup

```bash
# backend
cd backend
cp .env.example .env   # fill in real values
npm install
npm run seed             # creates the master admin + 10 advisor accounts once
npm run dev               # http://localhost:5000

# frontend (new terminal)
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                # http://localhost:5173
```

For the full non-technical, click-by-click deployment walkthrough (GitHub →
MongoDB Atlas → Render → Vercel → Gmail App Password), see
**DEPLOYMENT_GUIDE.md**.

---

## Feature checklist

- [x] 1 master admin login to manage 10 advisor accounts
- [x] 10 advisor logins, each manages their own availability + session types
- [x] No login required for students — book directly from the homepage
- [x] Booking form captures student personal + meeting-requirement details
- [x] Booking details emailed to the advisor's registered Gmail
- [x] Confirmation email sent to the student
- [x] Recurring weekly availability per advisor + date-specific overrides
- [x] Multiple session types per advisor (title, duration, description, mode)
- [x] Buffer time, minimum notice, and max booking window per session type
- [x] Professional CDC-branded landing page and booking flow

## Notes

- **Creating the 11 accounts**: after deploying the backend, visit
  `https://<your-backend>/api/setup/seed?secret=<SEED_SECRET>` once in a
  browser (see the deployment guide) — this works even on Render's free
  tier, which has no Shell access. `npm run seed` does the same thing if
  you're running locally or have Shell access.
- **Render free tier cold starts**: the backend "sleeps" after ~15 minutes of
  no traffic; the first request after that takes 30-50 seconds. Fine for a
  CDC-scale tool; not something to worry about for normal use.
- **Changing an advisor's password**: only the master admin can do this,
  from the Master Admin dashboard → Advisor Accounts → Edit → Reset
  password. The advisor is then forced to set their own password on next
  login.
- **Adding more advisors later**: run the seed script again after raising
  the loop count in `backend/seed.js` (currently fixed at 10 as requested),
  or ask me to add an "add advisor" button to the Master Admin dashboard.
