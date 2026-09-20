import { getWorkResultById } from '../../src/logic/data-persistence';
import { GetWorkResultByIdInput, GetWorkResultByIdOutput, DatabaseAccessError } from '../../src/logic/data-persistence';

// Mock only the database access layer, not getWorkResultById itself
jest.mock('../../src/logic/database-access-layer', () => ({
  queryWorkResultById: jest.fn(),
}));

describe('SCEN-720: getWorkResultById - DatabaseAccessError handling', () => {
  let mockQueryWorkResultById: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { queryWorkResultById } = require('../../src/logic/database-access-layer');
    mockQueryWorkResultById = queryWorkResultById;
  });

  it('should throw DatabaseAccessError when database query fails with connection timeout', async () => {
    // Setup: Create valid input with workResultId
    const input: GetWorkResultByIdInput = {
      workResultId: 'WR-001',
    };

    // Stub the database access layer to simulate connection timeout error
    mockQueryWorkResultById.mockRejectedValueOnce(
      new Error('connection timeout')
    );

    // Execute and verify that DatabaseAccessError is thrown
    try {
      await getWorkResultById(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(DatabaseAccessError);
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('Failed to retrieve work result from database: connection timeout');
    }
  });

  it('should throw DatabaseAccessError when database query fails with SQL syntax error', async () => {
    // Setup: Create valid input with workResultId
    const input: GetWorkResultByIdInput = {
      workResultId: 'WR-001',
    };

    // Stub the database access layer to simulate SQL syntax error
    mockQueryWorkResultById.mockRejectedValueOnce(
      new Error('SQL syntax error')
    );

    // Execute and verify that DatabaseAccessError is thrown
    try {
      await getWorkResultById(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(DatabaseAccessError);
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('Failed to retrieve work result from database: SQL syntax error');
    }
  });

  it('should include database error details in the error message passed from database access layer', async () => {
    // Setup: Create valid input with workResultId
    const input: GetWorkResultByIdInput = {
      workResultId: 'WR-001',
    };

    // Stub the database access layer to pass specific database error details
    mockQueryWorkResultById.mockRejectedValueOnce(
      new Error('connection pool exhausted')
    );

    // Execute and verify that DatabaseAccessError is thrown with proper error message
    try {
      await getWorkResultById(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(DatabaseAccessError);
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('Failed to retrieve work result from database: connection pool exhausted');
    }
  });

  it('should return work result data with actual quantity, completion datetime, and status when query succeeds', async () => {
    // Setup: Create valid input with workResultId
    const input: GetWorkResultByIdInput = {
      workResultId: 'WR-001',
    };

    // Mock successful database query response
    const mockData = {
      workResultId: 'WR-001',
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      actualStartDateTime: '2024-01-15T08:00:00Z',
      actualEndDateTime: '2024-01-15T16:30:00Z',
      actualQuantity: 150,
      workStatus: 'completed',
      defectCount: 2,
      remarks: 'Work completed successfully',
      createdAt: '2024-01-15T07:55:00Z',
      updatedAt: '2024-01-15T16:35:00Z',
      createdBy: 'U-001',
      updatedBy: 'U-002',
    };

    mockQueryWorkResultById.mockResolvedValueOnce(mockData);

    // Execute
    const result: GetWorkResultByIdOutput = await getWorkResultById(input);

    // Verify that work result data is returned with correct structure
    expect(result).toBeDefined();
    expect(result.workResultId).toBe('WR-001');
    expect(result.actualQuantity).toBe(150);
    expect(result.actualEndDateTime).toBe('2024-01-15T16:30:00Z');
    expect(result.workStatus).toBe('completed');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});