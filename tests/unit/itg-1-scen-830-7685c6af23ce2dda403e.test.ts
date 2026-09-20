import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-830: 更新時に allocationExecutionStatusId が入力値のまま保持される', () => {
  it('should preserve the provided allocationExecutionStatusId during update', async () => {
    const input = {
      allocationExecutionStatusId: 'EXISTING-ID-001',
      allocationPlanId: 'PLAN-100',
      workInstructionId: 'INSTR-200',
      workerId: 'WORKER-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-A',
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-15T08:00:00Z',
      plannedEndDateTime: '2025-01-15T16:00:00Z',
      actualStartDateTime: '2025-01-15T08:15:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: 2.5,
      progressRate: 31,
      delayFlag: false,
      remarks: '進捗確認済み',
      createdBy: 'USER-CREATOR',
      updatedBy: 'USER-UPDATER',
    };

    const output = await saveAllocationExecutionStatus(input);

    expect(output.allocationExecutionStatusId).toBe('EXISTING-ID-001');
    expect(output.allocationPlanId).toBe('PLAN-100');
    expect(output.workInstructionId).toBe('INSTR-200');
    expect(output.workerId).toBe('WORKER-001');
    expect(output.facilityId).toBe('FAC-001');
    expect(output.teamId).toBe('TEAM-A');
    expect(output.allocationState).toBe('進行中');
    expect(output.progressRate).toBe(31);
    expect(output.delayFlag).toBe(false);
    expect(output.isNewRecord).toBe(false);
    expect(output.savedAt).toBeDefined();
    expect(typeof output.savedAt).toBe('string');
    expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});