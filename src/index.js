const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://ambharat314.github.io',
    'http://ambharat314.github.io'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
