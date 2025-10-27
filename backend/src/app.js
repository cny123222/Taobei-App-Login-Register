const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Taobei Backend is running' });
});

// Test endpoint to get verification code (only for testing)
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  app.get('/api/test/verification-code/:phoneNumber', async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const database = require('./database');
      const code = await database.getVerificationCode(phoneNumber);
      if (code) {
        res.json({ code: code.code });
      } else {
        res.status(404).json({ error: 'Verification code not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (require.main === module) {
  // Initialize database connection
  database.connect().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
}

module.exports = app;