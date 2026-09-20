import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';
import * as productivityModule from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-339: 生産性データをデータベースに保存する際にI/Oエラーが発生した場合', () => {
  let originalConsoleError: any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  it('永続化エラーが発生する', async () => {
    const handyTerminalWorkResults = [
      {
        workInstructionId: 'instr-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T12:00:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        errorCount: 2,
        remarks: 'Normal work'
      }
    ];

    const wmsWorkResults = [
      {
        workInstructionId: 'instr-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T12:00:00Z',
        completedQuantity: 100,
        defectQuantity: 5
      }
    ];

    const aggregationDate = '2024-01-15';
    const executingUserId = 'user-001';

    // Mock all dependency functions to return valid normal-case values
    jest.spyOn(productivityModule as any, 'validateDateTimeRange').mockReturnValue(undefined);
    jest.spyOn(productivityModule as any, 'validateNumericQuantity').mockReturnValue(undefined);
    jest.spyOn(productivityModule as any, 'validateReferentialIntegrity').mockReturnValue(undefined);
    jest.spyOn(productivityModule as any, 'calculateProductivityRate').mockReturnValue(100);
    jest.spyOn(productivityModule as any, 'calculateWorkHours').mockReturnValue(3);
    jest.spyOn(productivityModule as any, 'judgeProficiencyLevel').mockReturnValue('intermediate');
    jest.spyOn(productivityModule as any, 'getWorkerById').mockResolvedValue({ workerId: 'worker-001', name: 'Test Worker' });
    jest.spyOn(productivityModule as any, 'getWorkInstructionById').mockResolvedValue({ workInstructionId: 'instr-001', plannedWorkHours: 3 });
    jest.spyOn(productivityModule as any, 'getProficiencyById').mockResolvedValue({ proficiencyLevel: 3 });
    jest.spyOn(productivityModule as any, 'recordOperationAudit').mockResolvedValue(undefined);

    // Mock saveProductivityData to throw I/O error
    const ioError = { code: 'IO_ERROR', message: 'Database write failed: connection timeout' };
    jest.spyOn(productivityModule as any, 'saveProductivityData').mockRejectedValue(ioError);

    let errorThrown: any = null;

    try {
      await aggregateWorkResultsAndCalculateProductivity({
        handyTerminalWorkResults,
        wmsWorkResults,
        aggregationDate,
        executingUserId
      });
    } catch (error: any) {
      errorThrown = error;
    }

    expect(errorThrown).toBeDefined();
    expect(errorThrown.name).toBe('DataPersistenceError');

    // Verify error message format with embedded details
    expect(errorThrown.message).toMatch(/生産性データの保存に失敗しました。対象:\s*.*エラー詳細:/);

    // Verify targetEntity and errorDetail properties
    expect(errorThrown.targetEntity).toBeDefined();
    expect(typeof errorThrown.targetEntity).toBe('string');

    expect(errorThrown.errorDetail).toBeDefined();
    expect(errorThrown.errorDetail.code).toBe('IO_ERROR');
    expect(errorThrown.errorDetail.message).toContain('Database write failed');

    // Verify message contains the actual embedded error details from saveProductivityData stub
    expect(errorThrown.message).toContain('IO_ERROR');
    expect(errorThrown.message).toContain('Database write failed: connection timeout');

    // Verify output type is not returned and is not the normal success type
    expect(errorThrown).not.toHaveProperty('aggregatedProductivityData');
    expect(errorThrown).not.toHaveProperty('processingStatistics');
    expect(errorThrown).not.toHaveProperty('persistenceResult');
    expect(errorThrown).not.toHaveProperty('dataConflicts');

    // Verify error is an exception object, not output structure
    expect(errorThrown instanceof Error).toBe(true);
  });
});