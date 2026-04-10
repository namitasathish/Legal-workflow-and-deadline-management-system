// tests/caseFiling.test.js
// Unit tests for Anonymous Case Filing API
// Run with: npm test

const request = require('supertest');
const app = require('../server');
const { assignCourt } = require('../routes/caseFiling');

// ─────────────────────────────────────────────────────────────
// We mock mongoose so we don't need a real DB during tests
// This is standard practice in CI/CD pipelines
// ─────────────────────────────────────────────────────────────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({ connection: { host: 'test-host' } }),
  };
});

// Mock the Case model
jest.mock('../models/Case', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const MockCase = jest.fn().mockImplementation((data) => ({
    ...data,
    filedAt: new Date(),
    lastUpdated: new Date(),
    save: mockSave,
  }));
  return MockCase;
});

describe('📋 Anonymous Case Filing API — POST /api/file-case', () => {

  describe('✅ Successful Filing Tests', () => {

    test('Should file a case with all details provided', async () => {
      const payload = {
        title: 'Bribery at RTO Office',
        description: 'The officer demanded Rs. 500 to pass my vehicle inspection. I have photo evidence.',
        category: 'Bribery',
        complainantName: 'Rajan Sharma',
      };

      const res = await request(app).post('/api/file-case').send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('caseId');
      expect(res.body.data.caseId).toMatch(/^IJC-/);
      expect(res.body.message).toContain('filed successfully');
    });

    test('Should file a case anonymously — name is optional', async () => {
      const payload = {
        title: 'Police Misconduct Report',
        description: 'Officer refused to register my FIR without any reason. This is a clear violation of protocol.',
        category: 'Misconduct',
        // No complainantName provided — this should work fine!
      };

      const res = await request(app).post('/api/file-case').send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('caseId');
    });

    test('Generated Case ID should start with IJC- prefix', async () => {
      const payload = {
        title: 'Corruption in Municipal Office',
        description: 'Officials are issuing building permits without proper inspection. Entire process is compromised.',
        category: 'Corruption',
      };

      const res = await request(app).post('/api/file-case').send(payload);
      expect(res.body.data.caseId).toMatch(/^IJC-[A-Z0-9]+-[A-Z0-9]+$/);
    });

  });

  describe('❌ Validation Failure Tests', () => {

    test('Should reject if title is missing', async () => {
      const payload = {
        description: 'Some description without a title provided here.',
        category: 'Other',
      };

      const res = await request(app).post('/api/file-case').send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('title');
    });

    test('Should reject if description is missing', async () => {
      const payload = {
        title: 'Missing Description Test Case',
        category: 'Other',
      };

      const res = await request(app).post('/api/file-case').send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Should reject if title is too short (less than 5 chars)', async () => {
      const payload = {
        title: 'Bad',
        description: 'This description is long enough to pass validation checks.',
        category: 'Other',
      };

      const res = await request(app).post('/api/file-case').send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('short');
    });

    test('Should reject if description is too short (less than 20 chars)', async () => {
      const payload = {
        title: 'Valid Title Here',
        description: 'Too short',
        category: 'Other',
      };

      const res = await request(app).post('/api/file-case').send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('20 characters');
    });

    test('Should reject empty body', async () => {
      const res = await request(app).post('/api/file-case').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

  });

  describe('🏛️ Court Assignment Helper Function', () => {

    test('Corruption cases go to Special Anti-Corruption Court', () => {
      expect(assignCourt('Corruption')).toBe('Special Anti-Corruption Court');
    });

    test('Bribery cases go to Special Anti-Corruption Court', () => {
      expect(assignCourt('Bribery')).toBe('Special Anti-Corruption Court');
    });

    test('Misconduct cases go to Administrative Tribunal', () => {
      expect(assignCourt('Misconduct')).toBe('Administrative Tribunal');
    });

    test('Harassment cases go to District Court', () => {
      expect(assignCourt('Harassment')).toBe('District Court');
    });

    test('Unknown category defaults to District Court', () => {
      expect(assignCourt('WeirdCategory')).toBe('District Court');
      expect(assignCourt(undefined)).toBe('District Court');
    });

  });

});
