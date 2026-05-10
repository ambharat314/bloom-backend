const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No authorization header' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        realtime: { transport: ws },
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Auth failed' });
  }
};
