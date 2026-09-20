import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';
import { SaveAllocationExecutionStatusInput } from '../../src/logic/data-persistence';

describe('SCEN-819: 実績工数が負数である場合、InvalidAllocationExecutionStatusInput エラーが発生する', () => {
  test('実績工数が負数の場合、InvalidAllocationExecutionStatusInput エラーがスローされる', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-01T08:00:00Z',
      plannedEndDateTime: '2024-01-01T16:00:00Z',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T14:00:00Z',
      plannedWorkHours: 8,
      actualWorkHours: -2,
      progressRate: 75,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationExecutionStatusInput',
        message: expect.stringContaining(
          '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。'
        ),
      })
    );
  });
});