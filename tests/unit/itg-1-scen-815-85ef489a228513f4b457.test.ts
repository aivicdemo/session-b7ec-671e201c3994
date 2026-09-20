import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';
import type { SaveAllocationExecutionStatusInput } from '../../src/logic/data-persistence';

describe('SCEN-815: 計画開始日時が計画終了日時より後の場合、InvalidAllocationExecutionStatusInput エラーが発生する', () => {
  it('should throw InvalidAllocationExecutionStatusInput when plannedStartDateTime is after plannedEndDateTime', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '未開始',
      plannedStartDateTime: '2025-02-01T14:00:00Z',
      plannedEndDateTime: '2025-02-01T10:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 0,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-admin',
      updatedBy: null,
    };

    await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationExecutionStatusInput',
        message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
      }),
    );
  });
});