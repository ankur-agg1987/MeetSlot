const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');

// Sends emails through a single Gmail account (set up once by the master
// admin using a Gmail "App Password" - no Google Cloud project needed).
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatWhen(booking) {
  return DateTime.fromJSDate(booking.startTime).setZone(booking.timezone).toFormat("cccc, LLLL d, yyyy 'at' h:mm a");
}

// Notifies the advisor by email that a student has booked a session with them.
async function sendAdvisorNotification({ advisor, eventType, booking }) {
  if (!advisor.notifyEmail) {
    console.warn(`Advisor ${advisor.username} has no notifyEmail set - skipping notification`);
    return false;
  }
  const transporter = getTransporter();
  const when = formatWhen(booking);

  await transporter.sendMail({
    from: `"CDC MeetSlot" <${process.env.SMTP_USER}>`,
    to: advisor.notifyEmail,
    subject: `New session booked: ${booking.studentName} - ${when}`,
    html: `
      <h2>New Career Advisory Session Booked</h2>
      <p><strong>Session:</strong> ${eventType.title} (${eventType.duration} min)</p>
      <p><strong>When:</strong> ${when} (${booking.timezone})</p>
      <hr/>
      <h3>Student Details</h3>
      <p><strong>Name:</strong> ${booking.studentName}</p>
      <p><strong>Student ID:</strong> ${booking.studentId || '-'}</p>
      <p><strong>Email:</strong> ${booking.studentEmail}</p>
      <p><strong>Phone:</strong> ${booking.studentPhone || '-'}</p>
      <p><strong>Program:</strong> ${booking.program || '-'}</p>
      <p><strong>Year/Semester:</strong> ${booking.yearOrSemester || '-'}</p>
      <p><strong>Purpose:</strong> ${booking.purpose || '-'}</p>
      <p><strong>Message from student:</strong><br/>${booking.message || '-'}</p>
      <hr/>
      <p>Log in to your MeetSlot advisor dashboard to view or manage this booking.</p>
    `,
  });
  return true;
}

// Confirms the booking to the student.
async function sendStudentConfirmation({ advisor, eventType, booking }) {
  const transporter = getTransporter();
  const when = formatWhen(booking);

  await transporter.sendMail({
    from: `"CDC MeetSlot" <${process.env.SMTP_USER}>`,
    to: booking.studentEmail,
    subject: `Your session with ${advisor.name} is confirmed - ${when}`,
    html: `
      <h2>Your Career Advisory Session is Confirmed</h2>
      <p><strong>Advisor:</strong> ${advisor.name}${advisor.designation ? ` (${advisor.designation})` : ''}</p>
      <p><strong>Session:</strong> ${eventType.title} (${eventType.duration} min)</p>
      <p><strong>When:</strong> ${when} (${booking.timezone})</p>
      ${eventType.locationDetail ? `<p><strong>Location/Details:</strong> ${eventType.locationDetail}</p>` : ''}
      <hr/>
      <p>If you need to reschedule or cancel, please contact the Career Development Center.</p>
    `,
  });
  return true;
}

module.exports = { sendAdvisorNotification, sendStudentConfirmation };
