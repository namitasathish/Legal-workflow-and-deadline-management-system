const ManualTestUtils = require('./ManualTestUtils');
const tester = new ManualTestUtils('Milestone Chronology & Timeline');

const msLogic = {
    add: (milestones, title, dateStr, icon) => {
        const newMs = { id: 'm'+Date.now(), title, milestone_date: dateStr, icon: icon || '📌' };
        return [...milestones, newMs].sort((a,b) => new Date(a.milestone_date) - new Date(b.milestone_date));
    }
};

tester.section('Timeline Sorting');
let timeline = [];
timeline = msLogic.add(timeline, 'Hearing 2', '2023-11-05');
timeline = msLogic.add(timeline, 'Filing', '2023-10-15');
timeline = msLogic.add(timeline, 'Hearing 1', '2023-10-25');

tester.expect(timeline.length, 3, 'Should hold 3 milestones');
tester.expect(timeline[0].title, 'Filing', 'Filing should be sorted first chronologically');
tester.expect(timeline[2].title, 'Hearing 2', 'Hearing 2 should be sorted last chronologically');
tester.expect(timeline[0].icon, '📌', 'Default icon should apply to Filing');

tester.summary();
