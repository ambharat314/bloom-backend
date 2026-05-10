// ============================================================
// BLOOM Backend — Pattern Alerts Routes
// Fetch and manage AI-detected health patterns
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../supabaseAdmin');

const auth = require('../middleware/auth');
 
// GET /api/patterns — Fetch all pattern alerts for the user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('pattern_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ patterns: data });
  } catch (err) {
    console.error('GET /api/patterns error:', err.message);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

// PATCH /api/patterns/:id/read — Mark a pattern alert as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const patternId = req.params.id;

    const { data, error } = await supabase
      .from('pattern_alerts')
      .update({ is_read: true })
      .eq('id', patternId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ pattern: data });
  } catch (err) {
    console.error('PATCH /api/patterns/:id/read error:', err.message);
    res.status(500).json({ error: 'Failed to update pattern' });
  }
});

module.exports = router;
