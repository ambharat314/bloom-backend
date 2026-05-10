const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ambharat314.github.io'
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/logs',     require('./routes/logs'));
app.use('/api/patterns', require('./routes/patterns'));
app.use('/api/askbloom', require('./routes/askbloom'));
app.use('/api/doctor',   require('./routes/doctorprep'));

app.listen(process.env.PORT, () =>
  console.log(`Bloom backend on port ${process.env.PORT}`)
);
