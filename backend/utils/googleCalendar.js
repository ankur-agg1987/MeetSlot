const { google } = require('googleapis');
const { getOAuth2Client } = require('../config/googleClient');
const User = require('../models/User');

// Returns an authenticated OAuth2 client for this organizer, refreshing
// (and persisting) the access token if it has expired.
async function getAuthedClientForOrganizer(organizerId) {
  const user = await User.findById(organizerId).select(
    '+googleAccessToken +googleRefreshToken +googleTokenExpiry'
  );
  if (!user || !user.googleRefreshToken) {
    throw new Error('Organizer has not connected Google Calendar');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  // googleapis auto-refreshes on demand; persist any new token it issues.
  oauth2Client.on('tokens', async (tokens) => {
    const update = {};
    if (tokens.access_token) update.googleAccessToken = tokens.access_token;
    if (tokens.expiry_date) update.googleTokenExpiry = new Date(tokens.expiry_date);
    if (tokens.refresh_token) update.googleRefreshToken = tokens.refresh_token;
    if (Object.keys(update).length) {
      await User.findByIdAndUpdate(organizerId, update);
    }
  });

  return oauth2Client;
}

// Queries Google Calendar's freebusy API for the organizer's primary calendar
// over [timeMinISO, timeMaxISO). Returns an array of {start, end} busy blocks.
async function getBusyBlocks(organizerId, timeMinISO, timeMaxISO) {
  const auth = await getAuthedClientForOrganizer(organizerId);
  const calendar = google.calendar({ version: 'v3', auth });

  const resp = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      items: [{ id: 'primary' }],
    },
  });

  return resp.data.calendars.primary.busy || [];
}

// Creates a calendar event on the organizer's primary calendar, invites the
// client by email, and (for google_meet locations) attaches a Meet link.
async function createCalendarEvent({ organizerId, summary, description, startISO, endISO, timezone, clientEmail, wantsMeetLink }) {
  const auth = await getAuthedClientForOrganizer(organizerId);
  const calendar = google.calendar({ version: 'v3', auth });

  const requestBody = {
    summary,
    description,
    start: { dateTime: startISO, timeZone: timezone },
    end: { dateTime: endISO, timeZone: timezone },
    attendees: [{ email: clientEmail }],
    reminders: { useDefault: true },
  };

  if (wantsMeetLink) {
    requestBody.conferenceData = {
      createRequest: {
        requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const resp = await calendar.events.insert({
    calendarId: 'primary',
    requestBody,
    conferenceDataVersion: wantsMeetLink ? 1 : 0,
    sendUpdates: 'all', // emails the client an invite automatically
  });

  return {
    googleEventId: resp.data.id,
    meetLink: resp.data.hangoutLink || null,
  };
}

async function deleteCalendarEvent(organizerId, googleEventId) {
  const auth = await getAuthedClientForOrganizer(organizerId);
  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'all',
  });
}

module.exports = { getBusyBlocks, createCalendarEvent, deleteCalendarEvent };
