import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-821: saveAllocationExecutionStatus - WorkInstructionNotFound error', () => {
  it('should throw WorkInstructionNotFound error when workInstructionId does not exist', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'work-instruction-999',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-01T08:00:00Z',
      plannedEndDateTime: '2024-01-01T17:00:00Z',
      actualStartDateTime: '2024-01-01T08:15:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 50,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    await expect(saveAllocationExecutionStatus(input)).rejects.toThrow('WorkInstructionNotFound');
    await expect(saveAllocationExecutionStatus(input)).rejects.toMatchObject({
      name: 'WorkInstructionNotFound',
      message: expect.stringContaining('指定された作業指示が見つかりません'),
    });
  });
});