# MeetSlot — a Calendly-style scheduling app (MERN)

Full-stack booking app: organizers connect their real Google Calendar and set
availability; anyone with a Gmail account can sign in and book an open slot.
Bookings create a real Google Calendar event (with an optional Meet link) and
send the client a calendar invite by email — no extra email service needed.

## How auth works (two tiers, both Gmail-only)

1. **Organizer** (the person being booked): full Google OAuth 2.0 (server-side,
   `googleapis`), requesting `calendar.events` + `calendar.readonly` scopes.
   This is what lets the app read their free/busy time and create events.
2. **Client** (the person booking): lightweight **Google Identity Services**
   sign-in on the frontend — verifies they own a real Gmail account, but does
   **not** request calendar access. Enough to prove identity and to invite
   them to the event by email.

Both flows end in the same JWT session cookie, so one `User` model covers
both roles (`isOrganizer` flips on when someone connects their calendar).

## Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), `googleapis`,
  `google-auth-library`, `jsonwebtoken`, `luxon` for timezone-safe slot math.
- **Frontend**: React 18 + Vite, React Router, Axios.
- **Free hosting**: MongoDB Atlas (M0 free cluster) + Render (free web
  service) for the backend, Vercel (free) for the frontend.

## Project structure

```
calendly-clone/
  backend/     Express API (Node)
  frontend/    React app (Vite)
```

---

## 1. Google Cloud setup (required first — both environments need this)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create
   a new project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - Fill in app name, support email.
   - Scopes: add `.../auth/calendar.events`, `.../auth/calendar.readonly`,
     `openid`, `email`, `profile`.
   - **Test users**: while the app is in "Testing" status, add every Gmail
     address that needs to log in (yourself + anyone testing) — Google
     blocks unlisted users. To let *any* Gmail user sign in, you'll need to
     submit the app for verification later (see Notes below).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized JavaScript origins: your Vercel URL, e.g.
     `https://your-frontend.vercel.app` (and `http://localhost:5173` for dev).
   - Authorized redirect URIs: your Render backend callback, e.g.
     `https://your-backend.onrender.com/api/auth/google/callback` (and
     `http://localhost:5000/api/auth/google/callback` for dev).
   - Save the **Client ID** and **Client Secret**.

---

## 2. Database — MongoDB Atlas (free)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 (free)** cluster.
3. Database Access → add a database user (username/password).
4. Network Access → add IP `0.0.0.0/0` (allow from anywhere — required since
   Render's outbound IP isn't fixed on the free plan).
5. Get your connection string from **Connect → Drivers** — it looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/meetslot`.

---

## 3. Backend — deploy to Render (free)

1. Push this repo to GitHub.
2. On [render.com](https://render.com): **New → Web Service**, connect your
   repo, set **Root Directory** to `backend`.
3. Build command: `npm install`  ·  Start command: `npm start`.
4. Add environment variables (Render dashboard → Environment), copying the
   keys from `backend/.env.example`:
   - `MONGO_URI` — from Atlas
   - `JWT_SECRET` — any long random string
   - `CLIENT_URL` — your Vercel frontend URL (set after step 4 below; you can
     update it later)
   - `SERVER_URL` — your Render URL, e.g. `https://meetslot-backend.onrender.com`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — from Google Cloud
   - `GOOGLE_REDIRECT_URI` — `https://<your-render-url>/api/auth/google/callback`
   - `NODE_ENV=production`
5. Deploy. Note: Render's free tier spins down after inactivity — the first
   request after idle takes ~30-50s to wake up.

---

## 4. Frontend — deploy to Vercel (free)

1. On [vercel.com](https://vercel.com): **New Project**, import the repo, set
   **Root Directory** to `frontend`.
2. Framework preset: Vite (auto-detected).
3. Add environment variables (copy from `frontend/.env.example`):
   - `VITE_API_URL` — `https://<your-render-url>/api`
   - `VITE_GOOGLE_CLIENT_ID` — same Google Client ID as the backend
4. Deploy. Then go back to Render and set `CLIENT_URL` to this Vercel URL
   (and add it to Google Cloud's Authorized JavaScript origins), then
   redeploy the backend so CORS/redirects match.

---

## 5. Local development

```bash
# backend
cd backend
cp .env.example .env   # fill in real values, use localhost URLs
npm install
npm run dev             # http://localhost:5000

# frontend (new terminal)
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # http://localhost:5173
```

---

## Feature checklist (matches Calendly's core flow)

- [x] Organizer connects Google Calendar via OAuth (Gmail-secured)
- [x] Client signs in with Gmail before booking (Gmail-secured)
- [x] Organizer sets recurring weekly availability per day
- [x] Date-specific overrides (day off / one-off extra hours)
- [x] Multiple event types per organizer (title, duration, description, location)
- [x] Buffer time before/after meetings, minimum notice, max booking window
- [x] Real-time slot computation against actual Google Calendar busy times
- [x] Public booking page at `/u/<username>` and `/u/<username>/<event-slug>`
- [x] Booking creates a real Google Calendar event + emails the client an invite
- [x] Optional auto-generated Google Meet link
- [x] Both sides can view and cancel upcoming meetings

## Notes / limitations to know about

- **Google verification**: while your OAuth consent screen is in "Testing"
  mode, only the test users you listed can log in. For a public launch where
  any Gmail user can be an organizer, Google requires an app verification
  review (needed because of the `calendar.events` scope) — this is Google's
  process, not something this code can bypass.
- **Render free tier cold starts**: expect a delay on the first request after
  idle. Fine for a demo/personal tool; consider a paid tier for production.
- **Timezone**: organizer sets one IANA timezone in Availability settings;
  slots are converted to the client's local time automatically in the UI.
