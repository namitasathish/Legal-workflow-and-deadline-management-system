// models/Case.js
// Think of this as our "case file" blueprint — like a form with fixed fields

const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    // We use UUID here — totally random, totally untraceable. No serial numbers!
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    enum: ['Corruption', 'Misconduct', 'Harassment', 'Bribery', 'Other'],
    default: 'Other',
  },
  status: {
    type: String,
    enum: ['Pending', 'Hearing Scheduled', 'Under Review', 'Closed'],
    default: 'Pending',
  },
  // Name is OPTIONAL — we respect anonymity, no questions asked
  complainantName: {
    type: String,
    default: 'Anonymous',
    trim: true,
  },
  // We do NOT store IP addresses — privacy is not negotiable
  filedAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  hearingDate: {
    type: Date,
    default: null,
  },
  court: {
    type: String,
    default: 'District Court',
  },
  judge: {
    type: String,
    default: 'To Be Assigned',
  },
  nextAction: {
    type: String,
    default: 'Awaiting review by the concerned authority',
  },
});

// Auto-update lastUpdated on every save
caseSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Case', caseSchema);
