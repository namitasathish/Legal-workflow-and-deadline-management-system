const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('Appointments Workflow');

const apptLogic = {
    createAppointment: (dbArgs) => {
        return {
            id: 'a1',
            client_id: dbArgs.client_id,
            case_id: dbArgs.case_id || null,
            status: 'Requested',
            title: dbArgs.title
        };
    },
    updateStatus: (appt, newStatus) => {
        const validStatuses = ['Requested', 'Confirmed', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(newStatus)) return null;
        return { ...appt, status: newStatus };
    },
    filterByCase: (appts, caseId) => {
        return appts.filter(a => a.case_id === caseId);
    }
};

tester.section('Appointment Creation');
const req1 = apptLogic.createAppointment({ client_id: 'c1', case_id: 'case1', title: 'Hearing Prep' });
tester.expect(req1.status, 'Requested', 'New appointments should default to Requested status');
tester.expect(req1.case_id, 'case1', 'Should retain case linkage');

tester.section('Status Update Workflows');
const conf = apptLogic.updateStatus(req1, 'Confirmed');
tester.expect(conf.status, 'Confirmed', 'Should successfully update to Confirmed');

const invalid = apptLogic.updateStatus(req1, 'FakeStatus');
tester.expect(invalid, null, 'Should return null for invalid statuses');

tester.section('Global vs Case Specific Listing');
const globalAppts = [
    { id: '1', case_id: 'case1', title: 'Appt 1' },
    { id: '2', case_id: 'case2', title: 'Appt 2' },
    { id: '3', case_id: null, title: 'Appt 3' }
];

const filtered = apptLogic.filterByCase(globalAppts, 'case1');
tester.expect(filtered.length, 1, 'Should filter strictly by case ID');

tester.summary();
