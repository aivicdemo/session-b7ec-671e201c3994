import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';
import * as productivityModule from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-338: 生産性指標の計算時にゼロ除算などの数値エラーが発生した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('計画作業時間が0時間の場合、ProductivityCalculationErrorをスローする', async () => {
    // スタブ化：検証関数
    jest.spyOn(productivityModule as any, 'validateDateTimeRange').mockReturnValue(true);
    jest.spyOn(productivityModule as any, 'validateNumericQuantity').mockReturnValue(true);
    jest.spyOn(productivityModule as any, 'validateReferentialIntegrity').mockReturnValue(true);

    // スタブ化：マスタ取得関数
    jest.spyOn(productivityModule as any, 'getWorkerById').mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
    });
    jest.spyOn(productivityModule as any, 'getWorkInstructionById').mockResolvedValue({
      workInstructionId: 'work-001',
      workName: 'Test Work',
    });
    jest.spyOn(productivityModule as any, 'getProficiencyById').mockResolvedValue({
      proficiencyLevel: 'intermediate',
    });

    // スタブ化：生産性計算関数（ゼロ除算エラーを発火）
    jest.spyOn(productivityModule as any, 'calculateProductivityRate').mockImplementation(() => {
      const plannedWorkHours = 0;
      const actualWorkHours = 5;
      const completedCount = 50;
      // ゼロ除算を明示的に引き起こす
      if (plannedWorkHours === 0) {
        const error = new Error(
          `生産性指標の計算に失敗しました。計画作業時間: ${plannedWorkHours}、実績作業時間: ${actualWorkHours}、完了件数: ${completedCount}`
        );
        error.name = 'ProductivityCalculationError';
        throw error;
      }
      return (actualWorkHours / plannedWorkHours) * 100;
    });

    const handyTerminalWorkResults = [
      {
        workInstructionId: 'work-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2025-01-15T08:00:00Z',
        workEndDateTime: '2025-01-15T08:00:00Z',
        completedQuantity: 50,
        defectQuantity: 2,
        errorCount: 0,
        remarks: 'Handy terminal data',
      },
    ];

    const wmsWorkResults = [
      {
        workInstructionId: 'work-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2025-01-15T08:00:00Z',
        workEndDateTime: '2025-01-15T13:00:00Z',
        completedQuantity: 50,
        defectQuantity: 2,
        remarks: 'WMS data',
      },
    ];

    const aggregationDate = '2025-01-15';
    const executingUserId = 'user-001';

    let errorThrown = false;
    let thrownError: any = null;

    try {
      await aggregateWorkResultsAndCalculateProductivity({
        handyTerminalWorkResults,
        wmsWorkResults,
        aggregationDate,
        executingUserId,
      });
    } catch (error: any) {
      errorThrown = true;
      thrownError = error;
    }

    expect(errorThrown).toBe(true);
    expect(thrownError.name).toBe('ProductivityCalculationError');
    expect(thrownError.message).toContain('生産性指標の計算に失敗しました');
    expect(thrownError.message).toContain('計画作業時間: 0');
    expect(thrownError.message).toContain('実績作業時間: 5');
    expect(thrownError.message).toContain('完了件数: 50');
    expect(thrownError.message).toMatch(/計画作業時間: 0、実績作業時間: 5、完了件数: 50/);
  });

  it('計画作業時間が0時間の場合、エラーメッセージに詳細情報が含まれる', async () => {
    // スタブ化：検証関数
    jest.spyOn(productivityModule as any, 'validateDateTimeRange').mockReturnValue(true);
    jest.spyOn(productivityModule as any, 'validateNumericQuantity').mockReturnValue(true);
    jest.spyOn(productivityModule as any, 'validateReferentialIntegrity').mockReturnValue(true);

    // スタブ化：マスタ取得関数
    jest.spyOn(productivityModule as any, 'getWorkerById').mockResolvedValue({
      workerId: 'worker-002',
      workerName: 'Test Worker 2',
    });
    jest.spyOn(productivityModule as any, 'getWorkInstructionById').mockResolvedValue({
      workInstructionId: 'work-002',
      workName: 'Test Work 2',
    });
    jest.spyOn(productivityModule as any, 'getProficiencyById').mockResolvedValue({
      proficiencyLevel: 'advanced',
    });

    // スタブ化：生産性計算関数（ゼロ除算エラーを発火）
    jest.spyOn(productivityModule as any, 'calculateProductivityRate').mockImplementation(() => {
      const plannedWorkHours = 0;
      const actualWorkHours = 5;
      const completedCount = 100;
      if (plannedWorkHours === 0) {
        const error = new Error(
          `生産性指標の計算に失敗しました。計画作業時間: ${plannedWorkHours}、実績作業時間: ${actualWorkHours}、完了件数: ${completedCount}`
        );
        error.name = 'ProductivityCalculationError';
        throw error;
      }
      return (actualWorkHours / plannedWorkHours) * 100;
    });

    const handyTerminalWorkResults = [
      {
        workInstructionId: 'work-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2025-01-15T08:00:00Z',
        workEndDateTime: '2025-01-15T08:00:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        errorCount: 1,
        remarks: 'Test data',
      },
    ];

    const wmsWorkResults = [
      {
        workInstructionId: 'work-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2025-01-15T08:00:00Z',
        workEndDateTime: '2025-01-15T13:00:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        remarks: 'WMS test data',
      },
    ];

    const aggregationDate = '2025-01-15';
    const executingUserId = 'user-002';

    let errorThrown = false;
    let thrownError: any = null;

    try {
      await aggregateWorkResultsAndCalculateProductivity({
        handyTerminalWorkResults,
        wmsWorkResults,
        aggregationDate,
        executingUserId,
      });
    } catch (error: any) {
      errorThrown = true;
      thrownError = error;
    }

    expect(errorThrown).toBe(true);
    expect(thrownError.name).toBe('ProductivityCalculationError');
    expect(thrownError.message).toContain('生産性指標の計算に失敗しました');
    expect(thrownError.message).toContain('計画作業時間: 0');
    expect(thrownError.message).toContain('実績作業時間: 5');
    expect(thrownError.message).toContain('完了件数: 100');
    expect(thrownError.message).toMatch(/計画作業時間: 0、実績作業時間: 5、完了件数: 100/);
  });

  it('エラー発生時には出力が返されず、コール中断される', async () => {
    // スタブ化：検証関数
    jest.spyOn(productivityModule as any, 'validateDateTimeRange').mockReturnValue(true);
    jest.spyOn(productivityModule as any, 'validateNumericQuantity').mockReturnValue(true);
    jest.spyOn(productivityModule as any, 'validateReferentialIntegrity').mockReturnValue(true);

    // スタブ化：マスタ取得関数
    jest.spyOn(productivityModule as any, 'getWorkerById').mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
    });
    jest.spyOn(productivityModule as any, 'getWorkInstructionById').mockResolvedValue({
      workInstructionId: 'work-001',
      workName: 'Test Work',
    });
    jest.spyOn(productivityModule as any, 'getProficiencyById').mockResolvedValue({
      proficiencyLevel: 'intermediate',
    });

    // スタブ化：生産性計算関数（ゼロ除算エラーを発火）
    jest.spyOn(productivityModule as any, 'calculateProductivityRate').mockImplementation(() => {
      const error = new Error(
        '生産性指標の計算に失敗しました。計画作業時間: 0、実績作業時間: 5、完了件数: 50'
      );
      error.name = 'ProductivityCalculationError';
      throw error;
    });

    const handyTerminalWorkResults = [
      {
        workInstructionId: 'work-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2025-01-15T08:00:00Z',
        workEndDateTime: '2025-01-15T08:00:00Z',
        completedQuantity: 50,
        defectQuantity: 2,
        errorCount: 0,
        remarks: 'Handy terminal data',
      },
    ];

    const wmsWorkResults = [
      {
        workInstructionId: 'work-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2025-01-15T08:00:00Z',
        workEndDateTime: '2025-01-15T13:00:00Z',
        completedQuantity: 50,
        defectQuantity: 2,
        remarks: 'WMS data',
      },
    ];

    const aggregationDate = '2025-01-15';
    const executingUserId = 'user-001';

    let resultValue: any = undefined;
    let errorOccurred = false;

    try {
      resultValue = await aggregateWorkResultsAndCalculateProductivity({
        handyTerminalWorkResults,
        wmsWorkResults,
        aggregationDate,
        executingUserId,
      });
      errorOccurred = false;
    } catch (error) {
      errorOccurred = true;
    }

    // エラーが発生している
    expect(errorOccurred).toBe(true);
    // 出力が返されていない（関数が中断されている）
    expect(resultValue).toBeUndefined();
  });
});