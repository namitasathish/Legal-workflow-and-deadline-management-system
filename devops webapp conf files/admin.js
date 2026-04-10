// routes/admin.js
// Simple admin panel — view all filed cases (no auth needed for demo)

const express = require('express');
const router = express.Router();
const Case = require('../models/Case');

// GET /api/admin/cases
// Returns all cases filed in the system (for admin view)
router.get('/cases', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cases = await Case.find(filter)
      .sort({ filedAt: -1 }) // newest first
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'); // hide internal mongoose field

    const totalCases = await Case.countDocuments(filter);
    const totalPages = Math.ceil(totalCases / parseInt(limit));

    return res.status(200).json({
      success: true,
      message: `Found ${totalCases} case(s) in the system`,
      data: {
        cases,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCases,
          limit: parseInt(limit),
        },
        summary: {
          total: totalCases,
        },
      },
    });
  } catch (error) {
    console.error('Admin fetch error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load cases. Please try again.',
    });
  }
});

// GET /api/admin/stats
// Quick dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const total = await Case.countDocuments();
    const pending = await Case.countDocuments({ status: 'Pending' });
    const hearingScheduled = await Case.countDocuments({ status: 'Hearing Scheduled' });
    const underReview = await Case.countDocuments({ status: 'Under Review' });
    const closed = await Case.countDocuments({ status: 'Closed' });
    const anonymous = await Case.countDocuments({ complainantName: 'Anonymous' });

    return res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        hearingScheduled,
        underReview,
        closed,
        anonymous,
        namedFilings: total - anonymous,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Stats unavailable.' });
  }
});

// PATCH /api/admin/cases/:id/status
// Update a case status (admin action simulation)
router.patch('/cases/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, judge, nextAction } = req.body;

    const validStatuses = ['Pending', 'Hearing Scheduled', 'Under Review', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Choose from: ${validStatuses.join(', ')}`,
      });
    }

    const updatedCase = await Case.findOneAndUpdate(
      { caseId: id },
      { status, judge: judge || 'To Be Assigned', nextAction: nextAction || '', lastUpdated: new Date() },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Case status updated successfully.',
      data: updatedCase,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

module.exports = router;
