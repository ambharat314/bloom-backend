require('dotenv').config();
const router = require('express').Router();
const supabase = require('../supabaseAdmin');
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    });
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ user: data.user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ session: data.session, user: data.user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});
// GET /api/auth/profile
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    res.json({ user: data || user });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: 'Profile fetch failed' });
  }
});
// POST /api/auth/questionnaire
router.post('/questionnaire', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    // camelCase → snake_case + empty string → null
    const cleanBody = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => {
        const snakeKey = k.replace(/([A-Z])/g, '_$1').toLowerCase();
        return [snakeKey, v === '' ? null : v];
      })
    );
    console.log('Saving questionnaire:', JSON.stringify(cleanBody));
    const { data, error: dbError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        ...cleanBody,
        questionnaire_completed: true
      })
      .select()
      .single();
    if (dbError) {
      console.error('Questionnaire DB error:', JSON.stringify(dbError));
      return res.status(500).json({ error: dbError.message });
    }
    res.json({ user: data });
  } catch (err) {
    console.error('Questionnaire error:', err.message);
    res.status(500).json({ error: 'Questionnaire save failed' });
  }
});
// GET /api/auth/user
router.get('/user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    res.json({ user: data || user });
  } catch (err) {
    console.error('User fetch error:', err.message);
    res.status(500).json({ error: 'User fetch failed' });
  }
});
module.exports = router; bhai ye code kiske liye hai
