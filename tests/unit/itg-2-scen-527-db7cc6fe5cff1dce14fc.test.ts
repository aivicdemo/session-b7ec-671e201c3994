import { findInitialAssignmentByWorker } from '../../src/logic/persistence-layer';

// Mock the persistence layer module
jest.mock('../../src/logic/persistence-layer');

describe('SCEN-527: Initial Assignment Record Search', () => {
  describe('findInitialAssignmentByWorker', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return found=true with complete initial assignment data when record exists', async () => {
      const mockResult = {
        assignmentId: 'A-2024-001',
        workerId: 'W001',
        placementDepartment: '東京拠点',
        placementProcess: 'ピッキング',
        assignmentStartDate: new Date('2024-01-15'),
        assignmentEndDate: new Date('2024-03-31'),
        assignmentStatus: 'active',
        remarks: '繁忙期対応',
        createdAt: new Date('2024-01-10T09:00:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
        found: true,
      };

      (findInitialAssignmentByWorker as jest.Mock).mockResolvedValue(mockResult);

      const result = await findInitialAssignmentByWorker({
        workerId: 'W001',
        requestingUserId: 'U100',
      });

      expect(result.found).toBe(true);
      expect(result.assignmentId).toBe('A-2024-001');
      expect(result.workerId).toBe('W001');
      expect(result.placementDepartment).toBe('東京拠点');
      expect(result.placementProcess).toBe('ピッキング');
      expect(result.assignmentStartDate).toEqual(new Date('2024-01-15'));
      expect(result.assignmentEndDate).toEqual(new Date('2024-03-31'));
      expect(result.assignmentStatus).toBe('active');
      expect(result.remarks).toBe('繁忙期対応');
      expect(result.createdAt).toEqual(new Date('2024-01-10T09:00:00Z'));
      expect(result.updatedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
    });
  });
});