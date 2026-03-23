const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('Payment & Billing Consistencies');

const payLogic = {
    markPaid: (payment) => {
        if (payment.status === 'Paid') return payment;
        return { ...payment, status: 'Paid', paid_date: new Date().toISOString() };
    },
    clientView: (payments, clientId) => {
        return payments.filter(p => p.client_id === clientId);
    }
};

tester.section('Payment Status Transitions');
const pendingPay = { id: 'p1', amount: 500, status: 'Pending' };
const paidPay = payLogic.markPaid(pendingPay);

tester.expect(paidPay.status, 'Paid', 'Status should transition from Pending to Paid');
tester.expect(!!paidPay.paid_date, true, 'Paid_date timestamp should be appended');

const alreadyPaid = payLogic.markPaid(paidPay);
tester.expect(alreadyPaid.paid_date, paidPay.paid_date, 'Repeated markPaid should not alter timestamp');

tester.section('Client Consistency Check');
const globalLedger = [
    { id: '1', client_id: 'c1', amount: 500 },
    { id: '2', client_id: 'c2', amount: 1000 },
    { id: '3', client_id: 'c1', amount: 200 }
];

const c1Bill = payLogic.clientView(globalLedger, 'c1');
tester.expect(c1Bill.length, 2, 'Client View should strictly return scoped client_id records');

tester.summary();
