// Run once after deployment: `npm run seed`
// Creates the 1 master-admin login and 10 blank advisor logins.
// Safe to re-run - it will skip any username that already exists.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const AdminUser = require('./models/AdminUser');

async function seed() {
  await connectDB();

  const masterUsername = (process.env.MASTER_ADMIN_USERNAME || 'masteradmin').toLowerCase();
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD || 'ChangeMe123!';
  const advisorPassword = process.env.ADVISOR_SEED_PASSWORD || 'ChangeMe123!';

  const existing = await AdminUser.findOne({ username: masterUsername });
  if (!existing) {
    await AdminUser.create({
      username: masterUsername,
      passwordHash: await bcrypt.hash(masterPassword, 10),
      role: 'master_admin',
      name: 'Master Administrator',
      mustChangePassword: true,
    });
    console.log(`Created master admin: ${masterUsername} / ${masterPassword}`);
  } else {
    console.log(`Master admin "${masterUsername}" already exists - skipped`);
  }

  for (let i = 1; i <= 10; i++) {
    const username = `advisor${i}`;
    const already = await AdminUser.findOne({ username });
    if (already) {
      console.log(`Advisor "${username}" already exists - skipped`);
      continue;
    }
    await AdminUser.create({
      username,
      passwordHash: await bcrypt.hash(advisorPassword, 10),
      role: 'advisor',
      name: `Advisor ${i} (name not yet set)`,
      designation: 'Career Advisor',
      department: 'Career Development Center',
      isActive: false, // hidden from the homepage until master admin fills in real details
      mustChangePassword: true,
    });
    console.log(`Created advisor: ${username} / ${advisorPassword}`);
  }

  console.log('\nSeeding complete.');
  console.log('Log in as the master admin, then edit each advisor account to set their');
  console.log('real name, Gmail (for notifications), and a new password - and switch them');
  console.log('to "active" so they appear on the public homepage.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
