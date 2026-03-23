const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('Auth & Role Linkage');

const authLogic = {
    registerClient: (email, existingClients) => {
        const match = existingClients.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (!match) return { success: false, error: 'Lawyer has not added your profile yet.' };
        return { success: true, linked_client_id: match.id, role: 'client' };
    },
    loginUser: (email, password, dbUsers) => {
        const u = dbUsers.find(u => u.email === email && u.password === password);
        if (!u) return { success: false, error: 'Invalid email or password.' };
        return { success: true, session: { id: u.id, role: u.role, linked_client_id: u.linked_client_id } };
    }
};

tester.section('Client Registration Linkage');
const mockClients = [{ id: 'c1', email: 'client@demo.com' }];
const res1 = authLogic.registerClient('CLIENT@demo.com', mockClients);
tester.expect(res1.success, true, 'Should successfully link client with case-insensitive email');
tester.expect(res1.linked_client_id, 'c1', 'Should return the correct linked_client_id');

const res2 = authLogic.registerClient('unknown@demo.com', mockClients);
tester.expect(res2.success, false, 'Should fail if email not in lawyer database');

tester.section('User Login & Session Scopes');
const mockUsers = [
    { id: 'u1', email: 'lawyer@demo.com', password: '123', role: 'lawyer', linked_client_id: null },
    { id: 'u2', email: 'client@demo.com', password: '123', role: 'client', linked_client_id: 'c1' },
];
const sessionReq = authLogic.loginUser('client@demo.com', '123', mockUsers);
tester.expect(sessionReq.session.role, 'client', 'Session should contain correct role');
tester.expect(sessionReq.session.linked_client_id, 'c1', 'Session should contain linked_client_id for client');

tester.summary();
