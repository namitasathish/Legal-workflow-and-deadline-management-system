const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('In-App Messaging & Badges');

const msgLogic = {
    sendMessage: (body, senderRole, currentCounts) => {
        const nextCounts = { ...currentCounts };
        // If lawyer sends, increment client's unread
        // Since we store unread on the *receiving* side:
        if (senderRole === 'lawyer') nextCounts.client_unread++;
        else nextCounts.lawyer_unread++;
        
        return { message: { body, sender_role: senderRole, is_read: 0 }, counts: nextCounts };
    },
    markRead: (messages, readerRole) => {
        return messages.map(m => {
            // Target role is the exact opposite
            const otherRole = readerRole === 'lawyer' ? 'client' : 'lawyer';
            if (m.sender_role === otherRole) return { ...m, is_read: 1 };
            return m;
        });
    }
};

tester.section('Sending Messages & Unread Counts');
const initialCounts = { lawyer_unread: 0, client_unread: 0 };
const r1 = msgLogic.sendMessage('Hello lawyer', 'client', initialCounts);
tester.expect(r1.counts.lawyer_unread, 1, 'Lawyer unread count increments when client sends');
tester.expect(r1.counts.client_unread, 0, 'Client unread count remains unchanged');

const r2 = msgLogic.sendMessage('Hello client', 'lawyer', r1.counts);
tester.expect(r2.counts.client_unread, 1, 'Client unread count increments when lawyer sends');

tester.section('Marking Messages Read');
const chatState = [
    { body: 'Hello', sender_role: 'client', is_read: 0 },
    { body: 'Hi', sender_role: 'lawyer', is_read: 0 }
];

const lawyerReading = msgLogic.markRead(chatState, 'lawyer');
tester.expect(lawyerReading[0].is_read, 1, 'Client message should be marked read when Lawyer opens chat');
tester.expect(lawyerReading[1].is_read, 0, 'Lawyer message remains unaffected when Lawyer opens chat');

tester.summary();
