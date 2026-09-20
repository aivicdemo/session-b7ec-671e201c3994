import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-829: 人員配置実行状況の新規作成', () => {
  it('新規作成時に allocationExecutionStatusId がシステムにより自動生成される', async () => {
    const input = {
      allocationExecutionStatusId: undefined,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-15T12:00:00Z',
      actualStartDateTime: '2024-01-15T08:05:00Z',
      actualEndDateTime: undefined,
      plannedWorkHours: 4,
      actualWorkHours: undefined,
      progressRate: 25,
      delayFlag: false,
      remarks: undefined,
      createdBy: 'user-admin',
      updatedBy: undefined,
    };

    const output = await saveAllocationExecutionStatus(input);

    expect(output).toBeDefined();
    expect(output.allocationExecutionStatusId).toBeDefined();
    expect(typeof output.allocationExecutionStatusId).toBe('string');
    expect(output.allocationExecutionStatusId.length).toBeGreaterThan(0);
    expect(output.isNewRecord).toBe(true);
    expect(output.allocationPlanId).toBe('plan-001');
    expect(output.workInstructionId).toBe('instr-001');
    expect(output.workerId).toBe('worker-001');
    expect(output.facilityId).toBe('facility-001');
    expect(output.teamId).toBe('team-001');
    expect(output.allocationState).toBe('進行中');
    expect(output.progressRate).toBe(25);
    expect(output.delayFlag).toBe(false);
    expect(output.savedAt).toBeDefined();
    expect(typeof output.savedAt).toBe('string');
    const savedAtDate = new Date(output.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThan(0);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.savedAt)).toBe(true);
  });
});