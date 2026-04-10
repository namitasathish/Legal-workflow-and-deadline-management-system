// tests/caseTracker.test.js
// Unit tests for Case Tracking API
// These tests simulate real user scenarios

const request = require('supertest');
const app = require('../server');
const Case = require('../models/Case');

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({ connection: { host: 'test-host' } }),
  };
});

// Mock the Case model's findOne method
jest.mock('../models/Case', () => ({
  findOne: jest.fn(),
}));

describe('🔍 Case Tracking API — GET /api/case/:id', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ Case Found Tests', () => {

    test('Should return case details for a valid case ID', async () => {
      // Simulate what MongoDB would return
      Case.findOne.mockResolvedValue({
        caseId: 'IJC-ABCD12-EF3456',
        title: 'Corruption in Panchayat Office',
        status: 'Hearing Scheduled',
        category: 'Corruption',
        court: 'Special Anti-Corruption Court',
        judge: 'Hon. Justice Ramesh Kumar',
        hearingDate: new Date('2025-03-15'),
        filedAt: new Date('2025-01-10'),
        lastUpdated: new Date('2025-01-20'),
        nextAction: 'Appear before the court on the hearing date.',
      });

      const res = await request(app).get('/api/case/IJC-ABCD12-EF3456');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.caseId).toBe('IJC-ABCD12-EF3456');
      expect(res.body.data.status).toBe('Hearing Scheduled');
      expect(res.body.data.court).toBe('Special Anti-Corruption Court');
    });

    test('Should return Pending status correctly', async () => {
      Case.findOne.mockResolvedValue({
        caseId: 'IJC-PEND01-TEST1',
        title: 'Pending Case Test',
        status: 'Pending',
        category: 'Other',
        court: 'District Court',
        judge: 'To Be Assigned',
        hearingDate: null,
        filedAt: new Date(),
        lastUpdated: new Date(),
        nextAction: 'Awaiting review by the concerned authority',
      });

      const res = await request(app).get('/api/case/IJC-PEND01-TEST1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.hearingDate).toContain('Not yet scheduled');
    });

    test('Should return Closed status correctly', async () => {
      Case.findOne.mockResolvedValue({
        caseId: 'IJC-CLOSED-TEST1',
        title: 'Resolved Bribery Case',
        status: 'Closed',
        category: 'Bribery',
        court: 'Special Anti-Corruption Court',
        judge: 'Hon. Justice Priya Singh',
        hearingDate: new Date('2024-12-01'),
        filedAt: new Date('2024-10-01'),
        lastUpdated: new Date('2024-12-01'),
        nextAction: 'Case resolved. No further action required.',
      });

      const res = await request(app).get('/api/case/IJC-CLOSED-TEST1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('Closed');
    });

  });

  describe('❌ Case Not Found / Error Tests', () => {

    test('Should return 404 when case ID does not exist', async () => {
      Case.findOne.mockResolvedValue(null); // No case found

      const res = await request(app).get('/api/case/FAKE-ID-999');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No case found');
    });

    test('Should handle DB errors gracefully', async () => {
      Case.findOne.mockRejectedValue(new Error('Database connection lost'));

      const res = await request(app).get('/api/case/IJC-ERROR-TEST');

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });

  });

  describe('🏥 Health Check API', () => {

    test('GET /api/health should return 200 OK', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('up and running');
      expect(res.body).toHaveProperty('version');
    });

  });

});
