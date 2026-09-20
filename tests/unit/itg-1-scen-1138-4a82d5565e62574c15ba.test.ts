import { deleteDataByConditionAndType } from '../../src/logic/data-persistence';

describe('SCEN-1138: deleteDataByConditionAndType - Normal logical deletion with referential integrity check', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockDatabaseInsert: jest.Mock;
  let mockDatabaseUpdate: jest.Mock;
  let mockDatabaseQuery: jest.Mock;
  let facilityRecords: any[];

  beforeEach(() => {
    facilityRecords = [
      {
        id: 'F001',
        region: 'Tokyo',
        deletionFlag: false,
        deletedAt: null,
        createdAt: '2025-01-10T00:00:00.000Z',
      },
      {
        id: 'F002',
        region: 'Tokyo',
        deletionFlag: false,
        deletedAt: null,
        createdAt: '2025-01-10T00:00:00.000Z',
      },
      {
        id: 'F003',
        region: 'Tokyo',
        deletionFlag: false,
        deletedAt: null,
        createdAt: '2025-01-10T00:00:00.000Z',
      },
    ];

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue({ hasViolations: false });
    mockRecordOperationAudit = jest.fn().mockResolvedValue({ recorded: true });
    mockDatabaseInsert = jest.fn().mockResolvedValue({ insertedCount: 3 });
    mockDatabaseQuery = jest.fn().mockResolvedValue(facilityRecords);
    mockDatabaseUpdate = jest.fn().mockImplementation(async () => {
      const matchingRecords = facilityRecords.filter(r => r.region === 'Tokyo');
      const now = new Date().toISOString();
      matchingRecords.forEach(record => {
        record.deletionFlag = true;
        record.deletedAt = now;
      });
      return {
        modifiedCount: matchingRecords.length,
        deletedAt: now,
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should logically delete 3 facility records matching the filter condition and return correct output', async () => {
    // Step 1: Pre-insert test data into database
    await mockDatabaseInsert(facilityRecords);
    expect(mockDatabaseInsert).toHaveBeenCalledWith(facilityRecords);
    expect(facilityRecords).toHaveLength(3);
    expect(facilityRecords.every(r => r.deletionFlag === false)).toBe(true);

    // Step 2: Confirm no external key references by checking validateReferentialIntegrity
    const referentialCheckResult = await mockValidateReferentialIntegrity({
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
    });
    expect(referentialCheckResult.hasViolations).toBe(false);

    // Step 3: Confirm deletion permission
    const authResult = await mockAuthorizeOperation({
      userId: 'USER-A',
      dataType: 'facility',
      operation: 'delete',
    });
    expect(authResult.authorized).toBe(true);

    // Step 4: Execute deletion
    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    const result = await deleteDataByConditionAndType(input);

    // Step 5: Verify authorizeOperation was called
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'USER-A',
        dataType: 'facility',
        operation: 'delete',
      })
    );

    // Step 6: Verify validateReferentialIntegrity was called
    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(
      expect.objectContaining({
        dataType: 'facility',
        filterCondition: { region: 'Tokyo' },
      })
    );

    // Step 7: Verify recordOperationAudit was called
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'USER-A',
        operation: 'delete',
        dataType: 'facility',
      })
    );

    // Step 8: Verify deletion flag is updated to true for matching records in database
    const updatedRecords = facilityRecords.filter(r => r.region === 'Tokyo');
    expect(updatedRecords).toHaveLength(3);
    updatedRecords.forEach(record => {
      expect(record.deletionFlag).toBe(true);
    });

    // Step 9: Verify deletedAt timestamp is set for matching records in ISO 8601 format
    updatedRecords.forEach(record => {
      expect(record.deletedAt).toBeDefined();
      expect(record.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    // Step 10: Verify output
    expect(result).toMatchObject({
      dataType: 'facility',
      deletedRecordCount: 3,
      isLogicalDelete: true,
    });
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('should set deletion flag to true for all matching records', async () => {
    await mockDatabaseInsert(facilityRecords);

    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    await deleteDataByConditionAndType(input);

    const updatedRecords = facilityRecords.filter(r => r.region === 'Tokyo');
    expect(updatedRecords.every(r => r.deletionFlag === true)).toBe(true);
  });

  test('should record deletion timestamp in ISO 8601 format for all matching records', async () => {
    await mockDatabaseInsert(facilityRecords);

    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    const result = await deleteDataByConditionAndType(input);

    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    const updatedRecords = facilityRecords.filter(r => r.region === 'Tokyo');
    updatedRecords.forEach(record => {
      expect(record.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  test('should return isLogicalDelete as true', async () => {
    await mockDatabaseInsert(facilityRecords);

    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    const result = await deleteDataByConditionAndType(input);

    expect(result.isLogicalDelete).toBe(true);
  });

  test('should return correct deletedRecordCount matching filter condition', async () => {
    await mockDatabaseInsert(facilityRecords);

    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    const result = await deleteDataByConditionAndType(input);

    expect(result.deletedRecordCount).toBe(3);
  });

  test('should validate referential integrity for each matching record', async () => {
    await mockDatabaseInsert(facilityRecords);

    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    mockValidateReferentialIntegrity.mockResolvedValue({ hasViolations: false });

    await deleteDataByConditionAndType(input);

    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(
      expect.objectContaining({
        dataType: 'facility',
        filterCondition: { region: 'Tokyo' },
      })
    );
  });

  test('should have authorization checked before deletion', async () => {
    await mockDatabaseInsert(facilityRecords);

    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    await deleteDataByConditionAndType(input);

    expect(mockAuthorizeOperation).toHaveBeenCalledBefore(mockDatabaseUpdate as any);
  });

  test('should record audit log for deletion operation', async () => {
    await mockDatabaseInsert(facilityRecords);

    const input = {
      dataType: 'facility',
      filterCondition: { region: 'Tokyo' },
      deletedBy: 'USER-A',
    };

    await deleteDataByConditionAndType(input);

    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'USER-A',
        operation: 'delete',
        dataType: 'facility',
        recordCount: 3,
      })
    );
  });
});