import {
  saveAllocationExecutionStatus,
  SaveAllocationExecutionStatusInput,
} from '../../src/logic/data-persistence';

describe('SCEN-817: progressRate が 0～100 の範囲外である場合、InvalidAllocationExecutionStatusInput エラーが発生する', () => {
  it('progressRate が -10（範囲外：負の値）の場合、InvalidAllocationExecutionStatusInput エラーが発生する', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-01T08:00:00Z',
      plannedEndDateTime: '2025-01-01T17:00:00Z',
      actualStartDateTime: '2025-01-01T08:15:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: -10,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    try {
      await saveAllocationExecutionStatus(input);
      fail('InvalidAllocationExecutionStatusInput エラーが発生すると予想されましたが、エラーが発生しませんでした');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name || error.constructor.name).toBe('InvalidAllocationExecutionStatusInput');
      expect(error.message).toBe(
        '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。'
      );
    }
  });

  it('progressRate が 101（範囲外：100を超える値）の場合、InvalidAllocationExecutionStatusInput エラーが発生する', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-01T08:00:00Z',
      plannedEndDateTime: '2025-01-01T17:00:00Z',
      actualStartDateTime: '2025-01-01T08:15:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 101,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    try {
      await saveAllocationExecutionStatus(input);
      fail('InvalidAllocationExecutionStatusInput エラーが発生すると予想されましたが、エラーが発生しませんでした');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name || error.constructor.name).toBe('InvalidAllocationExecutionStatusInput');
      expect(error.message).toBe(
        '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。'
      );
    }
  });

  it('progressRate が 0 の場合、処理が正常に進行する', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '未開始',
      plannedStartDateTime: '2025-01-01T08:00:00Z',
      plannedEndDateTime: '2025-01-01T17:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 0,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatusId).toBeDefined();
    expect(result.progressRate).toBe(0);
    expect(result.isNewRecord).toBe(true);
  });

  it('progressRate が 100 の場合、処理が正常に進行する', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '完了',
      plannedStartDateTime: '2025-01-01T08:00:00Z',
      plannedEndDateTime: '2025-01-01T17:00:00Z',
      actualStartDateTime: '2025-01-01T08:15:00Z',
      actualEndDateTime: '2025-01-01T17:30:00Z',
      plannedWorkHours: 8,
      actualWorkHours: 9,
      progressRate: 100,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatusId).toBeDefined();
    expect(result.progressRate).toBe(100);
    expect(result.isNewRecord).toBe(true);
  });

  it('progressRate が 50（範囲内：正常値）の場合、処理が正常に進行する', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-01T08:00:00Z',
      plannedEndDateTime: '2025-01-01T17:00:00Z',
      actualStartDateTime: '2025-01-01T08:15:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: 4,
      progressRate: 50,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatusId).toBeDefined();
    expect(result.progressRate).toBe(50);
    expect(result.isNewRecord).toBe(true);
  });
});