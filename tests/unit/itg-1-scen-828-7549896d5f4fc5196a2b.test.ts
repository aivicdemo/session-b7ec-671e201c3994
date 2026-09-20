import { SaveAllocationExecutionStatusInput, SaveAllocationExecutionStatusOutput } from '../../src/logic/data-persistence';
import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-828: 人員配置実行状況データの保存と日時管理', () => {
  describe('saveAllocationExecutionStatus - 新規作成時の savedAt 検証', () => {
    it('新規作成モードで saveAllocationExecutionStatus を呼び出したとき、出力の savedAt が現在の日時（ISO 8601形式）として返される', async () => {
      const beforeCallTime = new Date();

      const input: SaveAllocationExecutionStatusInput = {
        allocationExecutionStatusId: null,
        allocationPlanId: 'plan-001',
        workInstructionId: 'instr-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocationState: '進行中',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        actualStartDateTime: '2024-01-15T09:15:00Z',
        actualEndDateTime: null,
        plannedWorkHours: 8.0,
        actualWorkHours: null,
        progressRate: 50,
        delayFlag: false,
        remarks: null,
        createdBy: 'user-001',
        updatedBy: undefined,
      };

      const output: SaveAllocationExecutionStatusOutput = await saveAllocationExecutionStatus(input);

      const afterCallTime = new Date();

      expect(output.savedAt).toBeDefined();
      expect(typeof output.savedAt).toBe('string');

      const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(output.savedAt).toMatch(iso8601Pattern);

      const savedAtTime = new Date(output.savedAt);
      expect(savedAtTime.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
      expect(savedAtTime.getTime()).toBeLessThanOrEqual(afterCallTime.getTime() + 1000);

      expect(output.isNewRecord).toBe(true);

      expect(output.allocationExecutionStatusId).toBeDefined();
      expect(typeof output.allocationExecutionStatusId).toBe('string');
      expect(output.allocationExecutionStatusId).not.toBe('');

      expect(output.progressRate).toBe(50);

      expect(output.delayFlag).toBe(false);

      expect(output.allocationPlanId).toBe('plan-001');
      expect(output.workInstructionId).toBe('instr-001');
      expect(output.workerId).toBe('worker-001');
      expect(output.facilityId).toBe('facility-001');
      expect(output.teamId).toBe('team-001');
      expect(output.allocationState).toBe('進行中');
    });
  });
});