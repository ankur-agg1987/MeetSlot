const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

// Creates the 1 master-admin account and 10 advisor accounts if they don't
// already exist. Safe to call more than once - existing usernames are
// skipped (and their passwords are left untouched). Returns a summary of
// what was created so the caller can display/print the credentials once.
async function seedAccounts() {
  const masterUsername = (process.env.MASTER_ADMIN_USERNAME || 'masteradmin').toLowerCase();
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD || 'ChangeMe123!';
  const advisorPassword = process.env.ADVISOR_SEED_PASSWORD || 'ChangeMe123!';

  const created = [];
  const skipped = [];

  const existingMaster = await AdminUser.findOne({ username: masterUsername });
  if (!existingMaster) {
    await AdminUser.create({
      username: masterUsername,
      passwordHash: await bcrypt.hash(masterPassword, 10),
      role: 'master_admin',
      name: 'Master Administrator',
      mustChangePassword: true,
    });
    created.push({ role: 'master_admin', username: masterUsername, password: masterPassword });
  } else {
    skipped.push(masterUsername);
  }

  for (let i = 1; i <= 10; i++) {
    const username = `advisor${i}`;
    const already = await AdminUser.findOne({ username });
    if (already) {
      skipped.push(username);
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
    created.push({ role: 'advisor', username, password: advisorPassword });
  }

  return { created, skipped };
}

module.exports = { seedAccounts };
