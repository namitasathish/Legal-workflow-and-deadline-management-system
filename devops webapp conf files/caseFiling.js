// routes/caseFiling.js
// The "File Anonymously" feature — report without fear, we protect your identity

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Case = require('../models/Case');

// POST /api/file-case
// Files a new anonymous complaint and returns a tracking ID
router.post('/', async (req, res) => {
  try {
    const { title, description, category, complainantName } = req.body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please give your complaint a title. Even a short one works!',
      });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please describe what happened. The more detail, the better — but keep it factual.',
      });
    }

    if (title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Title is too short. Please be a little more descriptive.',
      });
    }

    if (description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Description is too short. Please provide at least 20 characters.',
      });
    }

    // Generate a UUID-based case ID — completely random, completely private
    // This is NOT a serial number. You cannot guess someone else's case ID from yours.
    const caseId = `IJC-${uuidv4().split('-')[0].toUpperCase()}-${uuidv4().split('-')[1].toUpperCase()}`;

    // Determine hearing date (simulate: 30 days from now for non-pending cases)
    const hearingDate = new Date();
    hearingDate.setDate(hearingDate.getDate() + 30);

    const newCase = new Case({
      caseId,
      title: title.trim(),
      description: description.trim(),
      category: category || 'Other',
      complainantName: complainantName && complainantName.trim() !== '' 
        ? complainantName.trim() 
        : 'Anonymous',
      status: 'Pending',
      hearingDate,
      court: assignCourt(category),
      nextAction: 'Your complaint has been received. It will be reviewed within 7 working days.',
      // NOTE: We do NOT collect or store IP addresses — EVER.
    });

    await newCase.save();

    return res.status(201).json({
      success: true,
      message: 'Your complaint has been filed successfully! Save your Case ID — it is your only way to track this case.',
      data: {
        caseId: newCase.caseId,
        title: newCase.title,
        status: newCase.status,
        filedAt: new Date(newCase.filedAt).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        expectedHearing: new Date(hearingDate).toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
        court: newCase.court,
        importantNote: 'This Case ID is unique and untraceable. Please save it somewhere safe!',
      },
    });
  } catch (error) {
    console.error('Error filing case:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not file your case right now. Please try again.',
    });
  }
});

// Helper: Assign a court based on complaint category
function assignCourt(category) {
  const courtMap = {
    'Corruption': 'Special Anti-Corruption Court',
    'Misconduct': 'Administrative Tribunal',
    'Harassment': 'District Court',
    'Bribery': 'Special Anti-Corruption Court',
    'Other': 'District Court',
  };
  return courtMap[category] || 'District Court';
}

module.exports = router;
module.exports.assignCourt = assignCourt;
