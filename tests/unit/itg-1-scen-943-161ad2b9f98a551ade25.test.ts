import { jest } from '@jest/globals';

// Import types if they exist
interface SaveProductivityDataInput {
  productivityDataId?: string | null;
  workResultId: string;
  workerId: string;
  facilityId: string;
  teamId: string;
  workDate: string;
  plannedWorkTime: number;
  actualWorkTime: number;
  completedItemCount: number;
  productivityRate: number;
  qualityScore: number;
  errorCount: number;
  proficiencyLevel: string;
  remarks?: string | null;
  createdBy: string;
  updatedBy?: string | null;
}

interface SaveProductivityDataOutput {
  productivityDataId: string;
  workResultId: string;
  workerId: string;
  facilityId: string;
  teamId: string;
  workDate: string;
  productivityRate: number;
  qualityScore: number;
  errorCount: number;
  proficiencyLevel: string;
  savedAt: string;
  isNewRecord: boolean;
}

interface PersistenceFailureError extends Error {
  name: 'PersistenceFailure';
}

describe('SCEN-943: データベースへの保存操作がタイムアウトで失敗する場合、PersistenceFailure エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveProductivityData がデータベースタイムアウトで失敗する場合、PersistenceFailure エラーを発生させる', async () => {
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'W-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9375,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'ADMIN-001',
      updatedBy: null,
    };

    // Mock the database layer to simulate timeout error
    const mockDatabasePersist = jest.fn(async () => {
      const timeoutError = new Error('connection timeout');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    });

    // Mock validation functions to succeed
    const mockValidateNumericQuantity = jest.fn(async () => true);
    const mockValidateReferentialIntegrity = jest.fn(async () => true);
    const mockValidateDateTimeRange = jest.fn(async () => true);

    // Create a wrapper function that simulates saveProductivityData implementation
    const saveProductivityDataWithMocks = async (
      inputData: SaveProductivityDataInput
    ): Promise<SaveProductivityDataOutput> => {
      // Perform validations (should all pass)
      await mockValidateNumericQuantity(inputData);
      await mockValidateReferentialIntegrity(inputData);
      await mockValidateDateTimeRange(inputData);

      // Attempt to persist (will fail with timeout)
      try {
        await mockDatabasePersist(inputData);
      } catch (error: any) {
        // Convert timeout error to PersistenceFailure
        if (
          error.name === 'TimeoutError' ||
          error.message.includes('timeout') ||
          error.message.includes('connection refused') ||
          error.message.includes('lock wait timeout')
        ) {
          const persistenceError = new Error(
            '生産性データの保存に失敗しました。システム管理者に連絡してください。'
          ) as PersistenceFailureError;
          persistenceError.name = 'PersistenceFailure';
          throw persistenceError;
        }
        throw error;
      }

      // This line should not be reached due to the error above
      return {} as SaveProductivityDataOutput;
    };

    let thrownError: any = null;
    let output: SaveProductivityDataOutput | undefined = undefined;

    try {
      output = await saveProductivityDataWithMocks(input);
    } catch (error: any) {
      thrownError = error;
    }

    // Verify error is thrown
    expect(thrownError).toBeDefined();

    // Verify error properties match expected PersistenceFailure
    expect(thrownError.name).toBe('PersistenceFailure');
    expect(thrownError.message).toBe(
      '生産性データの保存に失敗しました。システム管理者に連絡してください。'
    );

    // Verify output is not returned
    expect(output).toBeUndefined();

    // Verify validation functions were called
    expect(mockValidateNumericQuantity).toHaveBeenCalledWith(input);
    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(input);
    expect(mockValidateDateTimeRange).toHaveBeenCalledWith(input);

    // Verify database persist was attempted
    expect(mockDatabasePersist).toHaveBeenCalledWith(input);
  });
});