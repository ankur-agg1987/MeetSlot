const express = require('express');
const { seedAccounts } = require('../utils/seedAccounts');

const router = express.Router();

// Visit this URL once in your browser (with the correct ?secret=) to create
// the master admin + 10 advisor accounts. Exists because Render's free tier
// has no Shell access to run `npm run seed` directly.
//
// Protected by the SEED_SECRET environment variable - only someone who knows
// that secret (i.e. you, since you set it in Render) can trigger this.
// Safe to visit more than once: accounts that already exist are skipped and
// their passwords are left untouched.
router.get('/seed', async (req, res) => {
  const expected = process.env.SEED_SECRET;
  if (!expected) {
    return res.status(500).json({ message: 'SEED_SECRET is not set on the server - add it in Render Environment settings first.' });
  }
  if (req.query.secret !== expected) {
    return res.status(403).json({ message: 'Incorrect or missing secret.' });
  }

  try {
    const { created, skipped } = await seedAccounts();
    res.json({
      message:
        created.length > 0
          ? 'Accounts created. SAVE THESE CREDENTIALS NOW - they will not be shown again unless you reset a password from the Master Admin dashboard.'
          : 'Nothing new to create - all accounts already existed.',
      created,
      alreadyExisted: skipped,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
