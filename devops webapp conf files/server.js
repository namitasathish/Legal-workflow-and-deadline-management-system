// server.js
// The heart of our backend — Express server that connects everything

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ──────────────────────────────────────────
// Middleware — what runs before every request
// ──────────────────────────────────────────
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Parse JSON body from POST requests
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from the /frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ──────────────────────────────────────────
// Routes — our API endpoints
// ──────────────────────────────────────────
const caseTrackerRoute = require('./routes/caseTracker');
const caseFilingRoute = require('./routes/caseFiling');
const adminRoute = require('./routes/admin');

app.use('/api/case', caseTrackerRoute);      // GET /api/case/:id
app.use('/api/file-case', caseFilingRoute);  // POST /api/file-case
app.use('/api/admin', adminRoute);           // GET /api/admin/cases

// Health check — is the server alive?
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Indian Judicial System API is up and running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────
// Catch-all: serve frontend for any unknown route
// ──────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ──────────────────────────────────────────
// MongoDB Connection
// ──────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// ──────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`🏛️  Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  return server;
};

// Only start the server if this file is run directly (not during tests)
if (require.main === module) {
  startServer();
}

module.exports = app;
