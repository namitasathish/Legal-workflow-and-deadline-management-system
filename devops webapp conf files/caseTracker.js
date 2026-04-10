// routes/caseTracker.js
// The "Track Your Case" feature — enter case ID, get instant update

const express = require('express');
const router = express.Router();
const Case = require('../models/Case');

// GET /api/case/:id
// Returns case status for a given case ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Basic validation — case ID should not be empty
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Case ID. It looks like you forgot to enter one!',
      });
    }

    const caseData = await Case.findOne({ caseId: id.trim() });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: `No case found with ID: ${id}. Double-check the ID and try again. It is case-sensitive!`,
      });
    }

    // Return a clean, layman-friendly response
    return res.status(200).json({
      success: true,
      message: 'Case found! Here are the details:',
      data: {
        caseId: caseData.caseId,
        title: caseData.title,
        status: caseData.status,
        category: caseData.category,
        court: caseData.court,
        judge: caseData.judge,
        hearingDate: caseData.hearingDate
          ? new Date(caseData.hearingDate).toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })
          : 'Not yet scheduled — check back later',
        filedAt: new Date(caseData.filedAt).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        lastUpdated: new Date(caseData.lastUpdated).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        nextAction: caseData.nextAction,
      },
    });
  } catch (error) {
    console.error('Error fetching case:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong on our end. Please try again in a moment.',
    });
  }
});

module.exports = router;
