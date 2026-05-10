const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://ambharat314.github.io'
  ],
  credentials: true
}));
app.use(express.json());

// Health check — Railway uses this to confirm the app is alive
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/logs',     require('./routes/logs'));
app.use('/api/patterns', require('./routes/patterns'));
app.use('/api/askbloom', require('./routes/askbloom'));
app.use('/api/doctor',   require('./routes/doctorprep'));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Bloom backend on port ${PORT}`));
