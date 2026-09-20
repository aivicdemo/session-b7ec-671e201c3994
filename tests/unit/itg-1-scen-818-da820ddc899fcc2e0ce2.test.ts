import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';
import { SaveAllocationExecutionStatusInput } from '../../src/logic/data-persistence';

describe('SCEN-818: 計画工数が負数である場合、InvalidAllocationExecutionStatusInput エラーが発生する', () => {
  it('should throw InvalidAllocationExecutionStatusInput error when plannedWorkHours is negative', async () => {
    const now = new Date().toISOString();
    const input: SaveAllocationExecutionStatusInput = {
      allocationPlanId: 'plan-123',
      workInstructionId: 'instr-456',
      workerId: 'worker-789',
      facilityId: 'facility-abc',
      teamId: 'team-def',
      allocationState: '進行中',
      plannedStartDateTime: now,
      plannedEndDateTime: new Date(Date.now() + 3600000).toISOString(),
      plannedWorkHours: -5.0,
      progressRate: 50,
      delayFlag: false,
      createdBy: 'user-001',
    };

    try {
      await saveAllocationExecutionStatus(input);
      fail('Expected InvalidAllocationExecutionStatusInput error to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidAllocationExecutionStatusInput');
      expect(error.message).toBe(
        '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。'
      );
    }
  });
});