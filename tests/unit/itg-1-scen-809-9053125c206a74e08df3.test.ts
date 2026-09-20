import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-809: 新規作成時に出力の isNewRecord フラグが true となる', () => {
  it('should return isNewRecord=true when allocationExecutionStatusId is null', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '未開始',
      plannedStartDateTime: '2025-01-15T08:00:00Z',
      plannedEndDateTime: '2025-01-15T17:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 0,
      delayFlag: false,
      remarks: null,
      createdBy: 'admin-001',
      updatedBy: null,
    };

    const output = await saveAllocationExecutionStatus(input);

    expect(output.isNewRecord).toBe(true);
    expect(output.allocationExecutionStatusId).toBeDefined();
    expect(output.allocationExecutionStatusId).not.toBeNull();
    expect(output.allocationPlanId).toBe('plan-001');
    expect(output.workInstructionId).toBe('instr-001');
    expect(output.workerId).toBe('worker-001');
    expect(output.facilityId).toBe('facility-001');
    expect(output.teamId).toBe('team-001');
    expect(output.allocationState).toBe('未開始');
    expect(output.progressRate).toBe(0);
    expect(output.delayFlag).toBe(false);
    expect(output.savedAt).toBeDefined();
    expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});