import { getFacilityById } from '../../src/logic/data-persistence';

// Mock the database module before importing getFacilityById
jest.mock('../../src/logic/database', () => ({
  queryDatabase: jest.fn(),
}));

describe('SCEN-515: データベース接続障害が発生するとDatabaseAccessErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DatabaseAccessError when database connection fails', async () => {
    const facilityId = 'FAC-001';
    const databaseModule = require('../../src/logic/database');
    const databaseConnectionError = new Error('Database connection failed');

    // Set up the mock to reject with connection error
    databaseModule.queryDatabase.mockRejectedValueOnce(databaseConnectionError);

    // Call getFacilityById and verify error
    let thrownError: unknown;
    try {
      await getFacilityById(facilityId);
      fail('Expected getFacilityById to throw an error');
    } catch (error) {
      thrownError = error;
    }

    // Verify DatabaseAccessError is thrown with correct message
    expect(thrownError).toBeDefined();
    const errorObj = thrownError as Record<string, any>;
    expect(errorObj.name).toBe('DatabaseAccessError');
    expect(errorObj.message).toBe('拠点マスタの検索に失敗しました。');

    // Verify that output type fields are not present in the error
    expect(errorObj).not.toHaveProperty('facilityId');
    expect(errorObj).not.toHaveProperty('facilityName');
    expect(errorObj).not.toHaveProperty('facilityCode');
    expect(errorObj).not.toHaveProperty('address');
    expect(errorObj).not.toHaveProperty('maxCapacity');
    expect(errorObj).not.toHaveProperty('currentCapacity');
    expect(errorObj).not.toHaveProperty('operatingStatus');
    expect(errorObj).not.toHaveProperty('responsiblePersonName');
    expect(errorObj).not.toHaveProperty('contactInfo');
    expect(errorObj).not.toHaveProperty('createdAt');
    expect(errorObj).not.toHaveProperty('updatedAt');
    expect(errorObj).not.toHaveProperty('createdBy');
    expect(errorObj).not.toHaveProperty('updatedBy');
  });
});