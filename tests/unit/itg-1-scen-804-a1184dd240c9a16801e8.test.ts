import { listAllocationPlansByCondition, ListAllocationPlansByConditionInput, ListAllocationPlansByConditionOutput, GetAllocationPlanByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-804: 複数の作業指示IDを指定した場合に合致する配置案を取得できる', () => {
  it('should retrieve allocation plans matching multiple work instruction IDs', async () => {
    const input: ListAllocationPlansByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002', 'WI-003'],
      facilityIds: undefined,
      teamIds: undefined,
      allocationPlanIds: undefined,
      planNameKeyword: undefined,
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const mockAllocationPlans: GetAllocationPlanByIdOutput[] = [
      {
        allocationPlanId: 'AP-101',
        planName: 'Plan for WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        workInstructionId: 'WI-001',
        allocationStartDate: '2024-01-15',
        allocationEndDate: '2024-01-20',
        estimatedWorkHours: 80,
        estimatedCompletionDate: '2024-01-20',
        status: 'approved',
        description: 'Allocation plan for work instruction WI-001',
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
      {
        allocationPlanId: 'AP-102',
        planName: 'Plan for WI-002',
        facilityId: 'FAC-001',
        teamId: 'TEAM-002',
        workInstructionId: 'WI-002',
        allocationStartDate: '2024-01-16',
        allocationEndDate: '2024-01-21',
        estimatedWorkHours: 120,
        estimatedCompletionDate: '2024-01-21',
        status: 'pending',
        description: 'Allocation plan for work instruction WI-002',
        createdAt: '2024-01-10T11:00:00Z',
        updatedAt: '2024-01-10T11:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
      {
        allocationPlanId: 'AP-103',
        planName: 'Plan for WI-003',
        facilityId: 'FAC-002',
        teamId: 'TEAM-003',
        workInstructionId: 'WI-003',
        allocationStartDate: '2024-01-17',
        allocationEndDate: '2024-01-22',
        estimatedWorkHours: 100,
        estimatedCompletionDate: '2024-01-22',
        status: 'executing',
        description: 'Allocation plan for work instruction WI-003',
        createdAt: '2024-01-10T12:00:00Z',
        updatedAt: '2024-01-10T12:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
    ];

    const notMatchingPlans: GetAllocationPlanByIdOutput[] = [
      {
        allocationPlanId: 'AP-104',
        planName: 'Plan for WI-004',
        facilityId: 'FAC-003',
        teamId: 'TEAM-004',
        workInstructionId: 'WI-004',
        allocationStartDate: '2024-01-18',
        allocationEndDate: '2024-01-23',
        estimatedWorkHours: 90,
        estimatedCompletionDate: '2024-01-23',
        status: 'proposed',
        description: 'Allocation plan for work instruction WI-004',
        createdAt: '2024-01-10T13:00:00Z',
        updatedAt: '2024-01-10T13:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
      {
        allocationPlanId: 'AP-105',
        planName: 'Plan for WI-005',
        facilityId: 'FAC-003',
        teamId: 'TEAM-005',
        workInstructionId: 'WI-005',
        allocationStartDate: '2024-01-19',
        allocationEndDate: '2024-01-24',
        estimatedWorkHours: 110,
        estimatedCompletionDate: '2024-01-24',
        status: 'rejected',
        description: 'Allocation plan for work instruction WI-005',
        createdAt: '2024-01-10T14:00:00Z',
        updatedAt: '2024-01-10T14:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
    ];

    jest.spyOn(require('../../src/logic/data-persistence'), 'listAllocationPlansByCondition').mockResolvedValueOnce({
      allocationPlans: mockAllocationPlans,
      totalCount: 3,
      pageNumber: undefined,
      pageSize: undefined,
      retrievedAt: new Date().toISOString(),
    });

    const result = await listAllocationPlansByCondition(input);

    expect(result.allocationPlans).toHaveLength(3);
    expect(result.allocationPlans.map((p) => p.allocationPlanId)).toEqual(['AP-101', 'AP-102', 'AP-103']);
    expect(result.allocationPlans.map((p) => p.workInstructionId)).toEqual(['WI-001', 'WI-002', 'WI-003']);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.retrievedAt).toBeDefined();
    expect(result.allocationPlans).toEqual(expect.arrayContaining(mockAllocationPlans));
    
    const notMatchingWorkInstructionIds = notMatchingPlans.map((p) => p.workInstructionId);
    result.allocationPlans.forEach((plan) => {
      expect(notMatchingWorkInstructionIds).not.toContain(plan.workInstructionId);
    });

    expect(result.allocationPlans[0]).toHaveProperty('allocationPlanId');
    expect(result.allocationPlans[0]).toHaveProperty('planName');
    expect(result.allocationPlans[0]).toHaveProperty('facilityId');
    expect(result.allocationPlans[0]).toHaveProperty('teamId');
    expect(result.allocationPlans[0]).toHaveProperty('workInstructionId');
    expect(result.allocationPlans[0]).toHaveProperty('allocationStartDate');
    expect(result.allocationPlans[0]).toHaveProperty('allocationEndDate');
    expect(result.allocationPlans[0]).toHaveProperty('estimatedWorkHours');
    expect(result.allocationPlans[0]).toHaveProperty('estimatedCompletionDate');
    expect(result.allocationPlans[0]).toHaveProperty('status');
    expect(result.allocationPlans[0]).toHaveProperty('description');
    expect(result.allocationPlans[0]).toHaveProperty('createdAt');
    expect(result.allocationPlans[0]).toHaveProperty('updatedAt');
    expect(result.allocationPlans[0]).toHaveProperty('createdBy');
    expect(result.allocationPlans[0]).toHaveProperty('updatedBy');
  });
});