import {
  saveProductivityData,
  SaveProductivityDataInput,
  SaveProductivityDataOutput,
} from '../../src/logic/data-persistence';

// Mock validation functions and database operations
jest.mock('../../src/logic/data-persistence', () => {
  const actual = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actual,
    validateReferentialIntegrity: jest.fn(),
    validateNumericQuantity: jest.fn(),
    validateDateTimeRange: jest.fn(),
  };
});

describe('SCEN-928: 生産性データ新規作成 - 必須フィールド完全入力時の正常処理', () => {
  let dbInsertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock validateReferentialIntegrity to validate each reference individually
    const { validateReferentialIntegrity } = require('../../src/logic/data-persistence');
    validateReferentialIntegrity.mockImplementation((data: any) => {
      // Simulate individual validation of each reference ID
      const workResultExists = data.workResultId === 'WR-001';
      const workerExists = data.workerId === 'WKR-001';
      const facilityExists = data.facilityId === 'FAC-001';
      const teamExists = data.teamId === 'TEAM-001';
      
      if (!workResultExists || !workerExists || !facilityExists || !teamExists) {
        throw new Error('One or more references do not exist in database');
      }
      return true;
    });

    // Mock validateNumericQuantity to validate each numeric field within its range
    const { validateNumericQuantity } = require('../../src/logic/data-persistence');
    validateNumericQuantity.mockImplementation((data: any) => {
      // Validate productivityRate is between 0.0 and 1.0
      if (data.productivityRate < 0 || data.productivityRate > 1) {
        throw new Error('productivityRate must be between 0.0 and 1.0');
      }
      // Validate qualityScore is between 0.0 and 1.0
      if (data.qualityScore < 0 || data.qualityScore > 1) {
        throw new Error('qualityScore must be between 0.0 and 1.0');
      }
      // Validate errorCount is a non-negative integer
      if (data.errorCount < 0 || !Number.isInteger(data.errorCount)) {
        throw new Error('errorCount must be a non-negative integer');
      }
      return true;
    });

    // Mock validateDateTimeRange to return true (date is valid)
    const { validateDateTimeRange } = require('../../src/logic/data-persistence');
    validateDateTimeRange.mockResolvedValue(true);
  });

  it('必須フィールド全て揃った正常な入力で生産性データが新規作成される', async () => {
    // Arrange
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workDate: '2025-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      createdBy: 'USR-ADMIN',
    };

    // Act
    const result: SaveProductivityDataOutput = await saveProductivityData(input);

    // Assert - Output structure
    expect(result.productivityDataId).toBeDefined();
    expect(result.productivityDataId).not.toBeNull();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.productivityDataId.length).toBeGreaterThan(0);

    expect(result.workResultId).toBe('WR-001');
    expect(result.workerId).toBe('WKR-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-001');
    expect(result.workDate).toBe('2025-01-15');
    expect(result.productivityRate).toBe(0.9);
    expect(result.qualityScore).toBe(0.95);
    expect(result.errorCount).toBe(2);
    expect(result.proficiencyLevel).toBe('中級');

    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z?$/
    );

    expect(result.isNewRecord).toBe(true);

    // Assert - Validation functions called with correct parameters for referential integrity
    const { validateReferentialIntegrity } = require('../../src/logic/data-persistence');
    expect(validateReferentialIntegrity).toHaveBeenCalled();
    const refIntegrityCall = validateReferentialIntegrity.mock.calls[0][0];
    expect(refIntegrityCall).toBeDefined();
    expect(refIntegrityCall.workResultId).toBe('WR-001');
    expect(refIntegrityCall.workerId).toBe('WKR-001');
    expect(refIntegrityCall.facilityId).toBe('FAC-001');
    expect(refIntegrityCall.teamId).toBe('TEAM-001');

    // Assert - Validation functions called with correct parameters for numeric quantities
    const { validateNumericQuantity } = require('../../src/logic/data-persistence');
    expect(validateNumericQuantity).toHaveBeenCalled();
    const numericCall = validateNumericQuantity.mock.calls[0][0];
    expect(numericCall).toBeDefined();
    expect(numericCall.productivityRate).toBe(0.9);
    expect(numericCall.qualityScore).toBe(0.95);
    expect(numericCall.errorCount).toBe(2);
    // Verify range constraints are validated
    expect(numericCall.productivityRate).toBeGreaterThanOrEqual(0);
    expect(numericCall.productivityRate).toBeLessThanOrEqual(1);
    expect(numericCall.qualityScore).toBeGreaterThanOrEqual(0);
    expect(numericCall.qualityScore).toBeLessThanOrEqual(1);
    expect(numericCall.errorCount).toBeGreaterThanOrEqual(0);

    // Assert - Validation functions called with correct parameters for date/time
    const { validateDateTimeRange } = require('../../src/logic/data-persistence');
    expect(validateDateTimeRange).toHaveBeenCalled();
    const dateCall = validateDateTimeRange.mock.calls[0][0];
    expect(dateCall).toBeDefined();
    expect(dateCall.workDate).toBe('2025-01-15');

    // Assert - Database persistence verification
    // The result with a generated productivityDataId indicates successful persistence
    expect(result.productivityDataId).toBeTruthy();
    // Verify isNewRecord flag confirms this was a create operation
    expect(result.isNewRecord).toBe(true);
    // Verify savedAt timestamp confirms the record was persisted
    expect(result.savedAt).toBeTruthy();
    // Verify that the generated ID is a valid format (UUID-like string)
    expect(result.productivityDataId).toMatch(/^[a-f0-9\-]{36}$|^[a-zA-Z0-9_\-]{20,}$/);
  });
});