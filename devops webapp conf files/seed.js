// backend/seed.js
// Seed script — adds demo cases to MongoDB so you can test the app immediately!
// Run with: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const Case = require('./models/Case');

const demoCases = [
  {
    caseId: 'IJC-DEMO01-PEND01',
    title: 'Bribery at Regional Transport Office, Pune',
    description: 'The officer at RTO counter no. 4 demanded Rs. 1500 to expedite vehicle registration process. I refused and was told to come back later. The process has been pending for 3 weeks.',
    category: 'Bribery',
    status: 'Pending',
    complainantName: 'Anonymous',
    court: 'Special Anti-Corruption Court',
    judge: 'To Be Assigned',
    nextAction: 'Your complaint has been received. It will be reviewed within 7 working days.',
    hearingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    caseId: 'IJC-DEMO02-HEAR01',
    title: 'Police Officer Refusing to File FIR',
    description: 'On 15th January 2025, I visited Koregaon Park Police Station to file an FIR for theft. The officer at the desk refused to register it without any valid reason and asked me to "sort it out on my own". I have a witness who was present.',
    category: 'Misconduct',
    status: 'Hearing Scheduled',
    complainantName: 'Suresh Patil',
    court: 'Administrative Tribunal',
    judge: 'Hon. Justice Priya Deshmukh',
    nextAction: 'Appear before the court on the hearing date. Bring original documents.',
    hearingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    caseId: 'IJC-DEMO03-CLOS01',
    title: 'Municipal Contractor Submitting Fake Work Completion Reports',
    description: 'Road repair work in Sector 12 was marked as completed in records but the road was never repaired. I have photos of the condition dated after the "completion" date. The contractor involved has connections with local officials.',
    category: 'Corruption',
    status: 'Closed',
    complainantName: 'Anonymous',
    court: 'Special Anti-Corruption Court',
    judge: 'Hon. Justice Ramesh Kumar',
    nextAction: 'Case resolved. The contractor has been blacklisted. No further action required.',
    hearingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    caseId: 'IJC-DEMO04-REV01',
    title: 'Workplace Harassment at Government Office',
    description: 'My supervisor at the district collectorate office has been creating a hostile work environment. He frequently makes demeaning remarks about junior staff, assigns impossible deadlines unfairly, and has threatened to write bad performance reports.',
    category: 'Harassment',
    status: 'Under Review',
    complainantName: 'Anonymous',
    court: 'District Court',
    judge: 'To Be Assigned',
    nextAction: 'Your case is currently being reviewed by the oversight committee. You will be notified within 14 days.',
    hearingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/judicial_system');
    console.log('✅ Connected to MongoDB');

    // Remove existing demo cases (don't delete all data!)
    await Case.deleteMany({ caseId: { $regex: /^IJC-DEMO/ } });
    console.log('🗑️  Old demo cases removed');

    // Insert fresh demo data
    await Case.insertMany(demoCases);
    console.log(`🌱 Seeded ${demoCases.length} demo cases successfully!`);
    console.log('\n🎯 Demo Case IDs to test with:');
    demoCases.forEach(c => console.log(`   ${c.caseId} → Status: ${c.status}`));
    console.log('\n✨ Go to http://localhost:3000 and try tracking these cases!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
