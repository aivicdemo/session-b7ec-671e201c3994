import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-814: 日時フォーマットが ISO 8601 に準拠していない場合、InvalidAllocationExecutionStatusInput エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidAllocationExecutionStatusInput error when plannedStartDateTime has invalid ISO 8601 format', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'AP-001',
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-13-01T09:00:00',
      plannedEndDateTime: '2024-01-01T17:00:00',
      actualStartDateTime: '2024-01-01T09:30:00',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 50,
      delayFlag: false,
      remarks: null,
      createdBy: 'USER-001',
      updatedBy: null,
    };

    let errorThrown = false;
    let errorMessage = '';

    try {
      await saveAllocationExecutionStatus(input);
      fail('Expected InvalidAllocationExecutionStatusInput error but none was thrown');
    } catch (error: any) {
      errorThrown = true;
      expect(error).toBeDefined();
      expect(error).toHaveProperty('name', 'InvalidAllocationExecutionStatusInput');
      expect(error).toHaveProperty('message');
      errorMessage = error.message;
      expect(error.message).toBe(
        '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。'
      );
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toBeTruthy();
  });
});