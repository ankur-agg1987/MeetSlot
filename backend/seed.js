// Run once after deployment: `npm run seed`
// Creates the 1 master-admin login and 10 blank advisor logins.
// Safe to re-run - it will skip any username that already exists.
require('dotenv').config();
const connectDB = require('./config/db');
const { seedAccounts } = require('./utils/seedAccounts');

async function run() {
  await connectDB();
  const { created, skipped } = await seedAccounts();

  created.forEach((c) => console.log(`Created ${c.role}: ${c.username} / ${c.password}`));
  skipped.forEach((u) => console.log(`"${u}" already exists - skipped`));

  console.log('\nSeeding complete.');
  if (created.length > 0) {
    console.log('Log in as the master admin, then edit each advisor account to set their');
    console.log('real name, Gmail (for notifications), and a new password - and switch them');
    console.log('to "active" so they appear on the public homepage.');
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
