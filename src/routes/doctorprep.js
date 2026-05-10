// ============================================================
// BLOOM Backend — Doctor Visit Prep Routes
// Generate and fetch doctor visit preparation reports
// ============================================================

const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../supabaseAdmin');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const auth = require('../middleware/auth');

// GET /api/doctorprep — Fetch existing doctor prep reports
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('doctor_prep_reports')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (error) throw error;

    res.json({ reports: data });
  } catch (err) {
    console.error('GET /api/doctorprep error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/doctorprep — Generate a new doctor prep report
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange } = req.body; // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }

    if (!dateRange || !dateRange.start || !dateRange.end) {
      return res.status(400).json({ error: 'dateRange with start and end is required' });
    }

    // Fetch symptom logs in the date range
    const { data: logs, error: logsError } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: true });

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      return res.status(400).json({ error: 'No symptom data found in the given date range' });
    }

    // Fetch pattern alerts
    const { data: patterns } = await supabase
      .from('pattern_alerts')
      .select('*')
      .eq('user_id', userId);

    // Use Claude to generate the report
    const reportPrompt = `Based on the following health tracking data, generate a comprehensive doctor visit preparation report in JSON format.

SYMPTOM LOGS (${logs.length} entries):
${JSON.stringify(logs, null, 2)}

DETECTED PATTERNS:
${JSON.stringify(patterns || [], null, 2)}

Generate a JSON response with this structure:
{
  "summary": "Brief overview paragraph",
  "topSymptoms": [{ "name": "string", "frequency": number, "avgSeverity": number }],
  "questions": ["Questions to ask the doctor"],
  "timeline": [{ "date": "YYYY-MM-DD", "event": "Notable event description" }],
  "cycleData": { "avgLength": number, "irregularities": ["string"] }
}

Be thorough but concise. Focus on medically relevant patterns.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2048,
      system: 'You are a medical data analyst. Output ONLY valid JSON, no markdown or explanation.',
      messages: [{ role: 'user', content: reportPrompt }],
    });

    let reportData;
    try {
      reportData = JSON.parse(response.content[0].text);
    } catch {
      reportData = { summary: response.content[0].text, topSymptoms: [], questions: [], timeline: [], cycleData: {} };
    }

    // Save report to database
    const { data: savedReport, error: saveError } = await supabase
      .from('doctor_prep_reports')
      .insert({
        user_id: userId,
        date_range: dateRange,
        summary: reportData.summary,
        top_symptoms: reportData.topSymptoms,
        patterns: patterns || [],
        questions: reportData.questions,
        timeline: reportData.timeline,
        cycle_data: reportData.cycleData,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) throw saveError;

    res.status(201).json({ report: savedReport });
  } catch (err) {
    console.error('POST /api/doctorprep error:', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
