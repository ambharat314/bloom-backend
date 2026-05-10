// ============================================================
// BLOOM — Auth Routes
// Registration, Login, Profile & Questionnaire
// ============================================================

const router = require('express').Router();
const supabase = require('../supabaseAdmin');
const auth = require('../middleware/auth');

// POST /api/auth/register — Create new user via Supabase Auth + save profile
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Auto-confirm for now
      user_metadata: { name }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile entry in user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        questionnaire_completed: false,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // User was created in auth but profile failed — still return success
    }

    res.status(201).json({
      user: authData.user,
      message: 'Registration successful'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login — Sign in and return session
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: data.user,
      session: data.session,
      profile,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/questionnaire — Save onboarding questionnaire
router.post('/questionnaire', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const questionnaire = req.body;

    // Upsert questionnaire data into user_questionnaires table
    const { data, error } = await supabase
      .from('user_questionnaires')
      .upsert({
        user_id: userId,
        // Personal Info
        name: questionnaire.name,
        date_of_birth: questionnaire.dateOfBirth,
        gender: questionnaire.gender,
        pronouns: questionnaire.pronouns,
        // Cycle Info
        last_period_start: questionnaire.lastPeriodStart,
        avg_cycle_length: questionnaire.avgCycleLength,
        avg_period_duration: questionnaire.avgPeriodDuration,
        cycle_regularity: questionnaire.cycleRegularity,
        flow_intensity: questionnaire.flowIntensity,
        // Symptoms & Health
        experience_pms: questionnaire.experiencePms,
        common_symptoms: questionnaire.commonSymptoms,
        pain_level: questionnaire.painLevel,
        diagnosed_conditions: questionnaire.diagnosedConditions,
        current_birth_control: questionnaire.currentBirthControl,
        // Lifestyle
        trying_to_conceive: questionnaire.tryingToConceive,
        avg_sleep_hours: questionnaire.avgSleepHours,
        exercise_frequency: questionnaire.exerciseFrequency,
        stress_level: questionnaire.stressLevel,
        dietary_preference: questionnaire.dietaryPreference,
        // Goals
        primary_goal: questionnaire.primaryGoal,
        tracked_before: questionnaire.trackedBefore,
        doctor_summaries: questionnaire.doctorSummaries,
        heard_about: questionnaire.heardAbout,
        // Meta
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Questionnaire save error:', error);
      return res.status(500).json({ error: 'Failed to save questionnaire' });
    }

    // Sync to legacy users table for compatibility with symptom_logs etc.
    await supabase.from('users').upsert({
      id: userId,
      name: questionnaire.name || 'User'
    });

    // Mark profile as questionnaire completed
    await supabase
      .from('user_profiles')
      .update({ questionnaire_completed: true })
      .eq('id', userId);

    res.json({ success: true, data });
  } catch (err) {
    console.error('Questionnaire error:', err);
    res.status(500).json({ error: 'Failed to save questionnaire' });
  }
});

// GET /api/auth/profile — Get user profile + questionnaire status
router.get('/profile', auth, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const { data: questionnaire } = await supabase
      .from('user_questionnaires')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      profile: profile || null,
      questionnaire: questionnaire || null,
      questionnaireCompleted: profile?.questionnaire_completed || false
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
