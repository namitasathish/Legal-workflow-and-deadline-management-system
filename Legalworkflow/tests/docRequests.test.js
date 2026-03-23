/**
 * Unit Tests for Document Requests and CRM Features
 * Uses the project's custom ManualTestUtils runner.
 */

const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('CRM & Client Portal Logic');

// Mock Logic for Document Requests
const crmLogic = {
    validateRequest: (title) => !!title && title.length > 3,
    getStatusColor: (status) => {
        const colors = { Pending: 'amber', Uploaded: 'blue', Accepted: 'green' };
        return colors[status] || 'gray';
    },
    calculateTotalPayments: (payments) => {
        return payments.reduce((acc, p) => {
            if (p.status === 'Paid') acc.paid += p.amount;
            else acc.pending += p.amount;
            return acc;
        }, { paid: 0, pending: 0 });
    }
};

// --- Test Suite ---

tester.section('Document Request Validation');
tester.expect(crmLogic.validateRequest('Aadhaar Card'), true, 'Valid title should pass');
tester.expect(crmLogic.validateRequest(''), false, 'Empty title should fail');
tester.expect(crmLogic.validateRequest('Abc'), false, 'Short title should fail');

tester.section('CRM Status Colors');
tester.expect(crmLogic.getStatusColor('Pending'), 'amber', 'Pending should be amber');
tester.expect(crmLogic.getStatusColor('Uploaded'), 'blue', 'Uploaded should be blue');
tester.expect(crmLogic.getStatusColor('Accepted'), 'green', 'Accepted should be green');
tester.expect(crmLogic.getStatusColor('Unknown'), 'gray', 'Unknown status should be gray');

tester.section('Payment Calculations');
const mockPayments = [
    { amount: 1000, status: 'Paid' },
    { amount: 500, status: 'Pending' },
    { amount: 2000, status: 'Paid' },
];
const result = crmLogic.calculateTotalPayments(mockPayments);
tester.expect(result.paid, 3000, 'Total paid should be 3000');
tester.expect(result.pending, 500, 'Total pending should be 500');

tester.summary();
