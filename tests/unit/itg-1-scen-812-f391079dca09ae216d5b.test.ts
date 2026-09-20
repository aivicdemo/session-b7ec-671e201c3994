import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-812: saveAllocationExecutionStatus - delayFlag should be false when actualEndDateTime is within plannedEndDateTime', () => {
  it('should return delayFlag as false when actual end datetime is before planned end datetime', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-123',
      workInstructionId: 'work-456',
      workerId: 'worker-789',
      facilityId: 'facility-001',
      teamId: 'team-002',
      allocationState: 'completed',
      plannedStartDateTime: '2024-01-15T09:00:00Z',
      plannedEndDateTime: '2024-01-15T18:00:00Z',
      actualStartDateTime: '2024-01-15T09:15:00Z',
      actualEndDateTime: '2024-01-15T17:30:00Z',
      plannedWorkHours: 480,
      actualWorkHours: 465,
      progressRate: 100,
      delayFlag: false,
      remarks: 'Task completed ahead of schedule',
      createdBy: 'user-admin-001',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatusId).toBeDefined();
    expect(typeof result.allocationExecutionStatusId).toBe('string');
    expect(result.allocationPlanId).toBe('plan-123');
    expect(result.workInstructionId).toBe('work-456');
    expect(result.workerId).toBe('worker-789');
    expect(result.facilityId).toBe('facility-001');
    expect(result.teamId).toBe('team-002');
    expect(result.allocationState).toBe('completed');
    expect(result.progressRate).toBe(100);
    expect(result.delayFlag).toBe(false);
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.isNewRecord).toBe(true);
  });

  it('should return delayFlag as false when actual end datetime equals planned end datetime', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-124',
      workInstructionId: 'work-457',
      workerId: 'worker-790',
      facilityId: 'facility-001',
      teamId: 'team-002',
      allocationState: 'completed',
      plannedStartDateTime: '2024-01-16T09:00:00Z',
      plannedEndDateTime: '2024-01-16T18:00:00Z',
      actualStartDateTime: '2024-01-16T09:00:00Z',
      actualEndDateTime: '2024-01-16T18:00:00Z',
      plannedWorkHours: 480,
      actualWorkHours: 480,
      progressRate: 100,
      delayFlag: false,
      remarks: 'Task completed on schedule',
      createdBy: 'user-admin-001',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result).toBeDefined();
    expect(result.delayFlag).toBe(false);
    expect(result.isNewRecord).toBe(true);
  });

  it('should preserve provided fields in output when saving allocation execution status', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-125',
      workInstructionId: 'work-458',
      workerId: 'worker-791',
      facilityId: 'facility-002',
      teamId: 'team-003',
      allocationState: 'in-progress',
      plannedStartDateTime: '2024-01-17T08:00:00Z',
      plannedEndDateTime: '2024-01-17T17:00:00Z',
      actualStartDateTime: '2024-01-17T08:30:00Z',
      actualEndDateTime: '2024-01-17T16:45:00Z',
      plannedWorkHours: 540,
      actualWorkHours: 495,
      progressRate: 95,
      delayFlag: false,
      remarks: 'Nearly on schedule',
      createdBy: 'user-manager-002',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result.allocationPlanId).toBe(input.allocationPlanId);
    expect(result.workInstructionId).toBe(input.workInstructionId);
    expect(result.workerId).toBe(input.workerId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.allocationState).toBe(input.allocationState);
    expect(result.progressRate).toBe(input.progressRate);
    expect(result.delayFlag).toBe(false);
  });

  it('should return proper output type with all required fields', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-126',
      workInstructionId: 'work-459',
      workerId: 'worker-792',
      facilityId: 'facility-003',
      teamId: 'team-004',
      allocationState: 'not-started',
      plannedStartDateTime: '2024-01-18T10:00:00Z',
      plannedEndDateTime: '2024-01-18T16:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      plannedWorkHours: 360,
      actualWorkHours: null,
      progressRate: 0,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-admin-003',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result).toHaveProperty('allocationExecutionStatusId');
    expect(result).toHaveProperty('allocationPlanId');
    expect(result).toHaveProperty('workInstructionId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('facilityId');
    expect(result).toHaveProperty('teamId');
    expect(result).toHaveProperty('allocationState');
    expect(result).toHaveProperty('progressRate');
    expect(result).toHaveProperty('delayFlag');
    expect(result).toHaveProperty('savedAt');
    expect(result).toHaveProperty('isNewRecord');
  });
});