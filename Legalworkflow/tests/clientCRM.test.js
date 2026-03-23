const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('Client CRM Logs');

const crmLogic = {
    logInteraction: (type, summary, dateStr, followUpDateStr) => {
        return {
            id: 'i1',
            type,
            summary,
            interaction_date: dateStr,
            follow_up_date: followUpDateStr,
            follow_up_done: 0
        };
    },
    markFollowUp: (interaction) => {
        return { ...interaction, follow_up_done: 1 };
    },
    getPending: (interactions) => {
        return interactions.filter(i => i.follow_up_date !== null && i.follow_up_done === 0);
    }
};

tester.section('Interaction Registration');
const i1 = crmLogic.logInteraction('call', 'Discussed settlement', '2023-10-01', '2023-10-05');
tester.expect(i1.follow_up_done, 0, 'New interactions with follow-up should be pending');

tester.section('Follow Up Workflows');
const pendingList = crmLogic.getPending([i1]);
tester.expect(pendingList.length, 1, 'getPending should return the interaction');

const completed = crmLogic.markFollowUp(pendingList[0]);
tester.expect(completed.follow_up_done, 1, 'markFollowUp should set done flag');

const afterComplete = crmLogic.getPending([completed]);
tester.expect(afterComplete.length, 0, 'Completed follow-up should no longer appear in pending pipeline');

tester.summary();
