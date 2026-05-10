const router = require('express').Router();
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  // Claude API baad mein add karenge
  res.json({ 
    reply: "Ask Bloom coming soon! 🌸",
    disclaimer: "Not medical advice."
  });
});

module.exports = router;