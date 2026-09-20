import { saveFacility, SaveFacilityInput, PersistenceError } from '../../src/logic/data-persistence';

// Mock the database client and validation functions
jest.mock('../../src/logic/database-client');
jest.mock('../../src/logic/validators');

import { getDbClient } from '../../src/logic/database-client';
import { validateInputFormat, validateNumericQuantity } from '../../src/logic/validators';

describe('SCEN-504: データベース接続に失敗した場合、永続化エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PersistenceError with correct message when database connection fails during saveFacility', async () => {
    // Arrange: Setup validation stubs to return success (normal case)
    (validateInputFormat as jest.Mock).mockReturnValue({ valid: true });
    (validateNumericQuantity as jest.Mock).mockReturnValue({ valid: true });

    // Setup database client to simulate connection failure
    const mockDbClient = {
      execute: jest.fn().mockRejectedValue(
        new Error('Database connection failed: Unable to connect to the database server')
      ),
    };
    (getDbClient as jest.Mock).mockReturnValue(mockDbClient);

    const input: SaveFacilityInput = {
      facilityId: null,
      facilityName: 'テスト拠点',
      facilityCode: 'TEST-001',
      address: '東京都渋谷区',
      maxCapacity: 50,
      currentCapacity: 30,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '03-xxxx-xxxx',
      createdBy: 'user001',
    };

    // Act & Assert: Call saveFacility and expect PersistenceError
    let thrownError: unknown = null;
    try {
      await saveFacility(input);
      fail('Expected saveFacility to throw PersistenceError');
    } catch (error) {
      thrownError = error;
    }

    // Assert: Verify that the error thrown is an instance of PersistenceError with the correct message
    expect(thrownError).toBeInstanceOf(PersistenceError);
    expect(thrownError).toHaveProperty('message', '拠点データの保存に失敗しました。システム管理者に連絡してください。');
    expect((thrownError as Error).name).toBe('PersistenceError');

    // Assert: Verify that SaveFacilityOutput is not returned by checking error was thrown
    // (If no error was thrown, the function would return SaveFacilityOutput, which is not the case)
    expect(thrownError).toBeDefined();

    // Verify that validation functions were called
    expect(validateInputFormat).toHaveBeenCalled();
    expect(validateNumericQuantity).toHaveBeenCalled();

    // Verify that database client was invoked
    expect(getDbClient).toHaveBeenCalled();
    expect(mockDbClient.execute).toHaveBeenCalled();
  });
});