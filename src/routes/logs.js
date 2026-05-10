const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../supabaseAdmin');

// GET /api/logs — fetch all logs for user
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST /api/logs — create new log
router.post('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('symptom_logs')
    .insert({ ...req.body, user_id: req.user.id })
    .select().single();
  if (error) return res.status(500).json({ error });
  res.status(201).json(data);
});

// DELETE /api/logs/:id
router.delete('/:id', auth, async (req, res) => {
  await supabase.from('symptom_logs')
    .delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ success: true });
});

module.exports = router;
