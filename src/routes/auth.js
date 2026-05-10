const router = require('express').Router();
const supabase = require('../supabaseAdmin');

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const { data, error } = await supabase.auth.admin.createUser({
    email, password,
    user_metadata: { name },
    email_confirm: true
  });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ user: data.user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ session: data.session, user: data.user });
});

module.exports = router;
