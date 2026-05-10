const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../supabaseAdmin');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', auth, async (req, res) => {
  const { message, conversationId } = req.body;

  // Fetch user's recent logs for context
  const { data: logs } = await supabase
    .from('symptom_logs').select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false }).limit(30);

  const contextStr = (logs || []).map(l =>
    `Date: ${l.date}, Energy: ${l.energy}/10, ` +
    `Symptoms: ${JSON.stringify(l.symptoms)}`
  ).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: `You are Bloom, an empathetic women's health AI assistant.`,
    messages: [{
      role: 'user',
      content: `User's recent health data:\n${contextStr}\n\nQuestion: ${message}`
    }]
  });

  const reply = response.content[0].text;

  // Save conversation to DB
  if (conversationId) {
    const { data: conv } = await supabase.from('conversations')
      .select('messages').eq('id', conversationId).single();
    const messages = [...(conv?.messages || []),
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: reply, timestamp: new Date() }
    ];
    await supabase.from('conversations')
      .update({ messages }).eq('id', conversationId);
  }

  res.json({ reply, disclaimer: 'Not medical advice.' });
});

module.exports = router;
