const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('Data Privacy Isolation Scopes');

const privacyLogic = {
    queryClientDocs: (allDocs, requestingClient) => {
        // Mocking the SQLite constraint WHERE client_id = ?
        return allDocs.filter(d => d.client_id === requestingClient);
    },
    queryCases: (allCases, requestingClient) => {
        return allCases.filter(c => c.client_id === requestingClient);
    }
};

const mockDB = {
    documents: [
        { id: 'd1', client_id: 'alice_id', title: 'Alice Info' },
        { id: 'd2', client_id: 'bob_id', title: 'Bob Info' }
    ],
    cases: [
        { id: 'c1', client_id: 'alice_id', title: 'Alice v State' },
        { id: 'c2', client_id: 'bob_id', title: 'Bob v State' }
    ]
};

tester.section('Document Privacy Scope');
const aliceDocs = privacyLogic.queryClientDocs(mockDB.documents, 'alice_id');
tester.expect(aliceDocs.length, 1, 'Alice should only see 1 document');
tester.expect(aliceDocs[0].client_id, 'alice_id', 'Document must belong exclusively to Alice');

tester.section('Case Privacy Scope');
const bobCases = privacyLogic.queryCases(mockDB.cases, 'bob_id');
tester.expect(bobCases.length, 1, 'Bob should only see 1 case');
tester.expect(bobCases[0].client_id, 'bob_id', 'Case must belong exclusively to Bob');

tester.summary();
