const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('Feedback & Closure Workflows');

const closureLogic = {
    closeCase: (caseObj, delayNotes, outcome) => {
        if (!['Won', 'Lost', 'Settled', 'Withdrawn'].includes(outcome)) return null;
        return { ...caseObj, status: 'Closed', outcome, delay_notes: delayNotes };
    },
    submitFeedback: (rating, comment) => {
        if (rating < 1 || rating > 5) return null;
        return { rating, comment, submitted_at: new Date().toISOString() };
    }
};

tester.section('Case Closure Validity');
const c1 = { id: 'case1', status: 'Open' };
const closed = closureLogic.closeCase(c1, 'Judge absent', 'Settled');
tester.expect(closed.status, 'Closed', 'Status changes to Closed');
tester.expect(closed.outcome, 'Settled', 'Outcome recorded');

const invalid = closureLogic.closeCase(c1, '', 'Fake');
tester.expect(invalid, null, 'Should return null for invalid outcome enums');

tester.section('Feedback Submission Bounds');
const fbOk = closureLogic.submitFeedback(4, 'Good job');
tester.expect(fbOk.rating, 4, 'Valid rating accepted');

const fbLow = closureLogic.submitFeedback(0, 'Terrible');
tester.expect(fbLow, null, 'Rating below 1 rejected');

const fbHigh = closureLogic.submitFeedback(6, 'Super');
tester.expect(fbHigh, null, 'Rating above 5 rejected');

tester.summary();
