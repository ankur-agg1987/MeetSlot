const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { getOAuth2Client, ORGANIZER_SCOPES } = require('../config/googleClient');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const idClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function slugifyUsername(name, email) {
  const base = (name || email.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------- ORGANIZER FLOW: full OAuth with Calendar scope ----------

// Step 1: redirect the organizer to Google's consent screen
router.get('/google', (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // required to get a refresh_token
    prompt: 'consent', // force refresh_token on every login
    scope: ORGANIZER_SCOPES,
  });
  res.redirect(url);
});

// Step 2: Google redirects back here with a ?code=
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.CLIENT_URL}/login?error=missing_code`);

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        username: slugifyUsername(payload.name, payload.email),
      });
    }

    user.isOrganizer = true;
    user.name = payload.name;
    user.picture = payload.picture;
    user.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token; // only sent on first consent
    if (tokens.expiry_date) user.googleTokenExpiry = new Date(tokens.expiry_date);
    await user.save();

    if (!user.googleRefreshToken) {
      // Edge case: user had already granted consent previously, so Google didn't resend
      // a refresh_token. They must revoke access at myaccount.google.com/permissions and retry.
      return res.redirect(`${process.env.CLIENT_URL}/login?error=reconnect_required`);
    }

    const token = signToken(user._id);
    setAuthCookie(res, token);
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
});

// ---------- CLIENT (booker) FLOW: lightweight identity-only sign-in ----------
// Frontend uses Google Identity Services to get an ID token, then posts it here.
router.post('/google/client', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken is required' });

    const ticket = await idClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload.email_verified) {
      return res.status(401).json({ message: 'Gmail account not verified' });
    }

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    } else {
      user.name = payload.name;
      user.picture = payload.picture;
      await user.save();
    }

    const token = signToken(user._id);
    setAuthCookie(res, token);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        isOrganizer: user.isOrganizer,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Client login error:', err);
    res.status(401).json({ message: 'Google sign-in verification failed' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      picture: u.picture,
      isOrganizer: u.isOrganizer,
      username: u.username,
      timezone: u.timezone,
    },
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
