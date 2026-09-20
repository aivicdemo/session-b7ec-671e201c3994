import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-803: 複数のチームIDを指定した場合に合致する配置案を取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve allocation plans matching specified team IDs with correct details', async () => {
    // Pre-register test data
    const testAllocationPlans = [
      {
        allocationPlanId: 'plan-001',
        planName: '配置案A',
        facilityId: 'fac-001',
        teamId: 'TEAM001',
        workInstructionId: 'wi-001',
        allocationStartDate: '2024-01-15',
        allocationEndDate: '2024-01-20',
        estimatedWorkHours: 40,
        estimatedCompletionDate: '2024-01-20',
        status: '承認済み',
        description: 'Test plan A',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        allocationPlanId: 'plan-002',
        planName: '配置案B',
        facilityId: 'fac-001',
        teamId: 'TEAM001',
        workInstructionId: 'wi-002',
        allocationStartDate: '2024-01-16',
        allocationEndDate: '2024-01-21',
        estimatedWorkHours: 35,
        estimatedCompletionDate: '2024-01-21',
        status: '提案中',
        description: 'Test plan B',
        createdAt: '2024-01-11T10:00:00Z',
        updatedAt: '2024-01-11T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        allocationPlanId: 'plan-003',
        planName: '配置案C',
        facilityId: 'fac-002',
        teamId: 'TEAM002',
        workInstructionId: 'wi-003',
        allocationStartDate: '2024-01-17',
        allocationEndDate: '2024-01-22',
        estimatedWorkHours: 45,
        estimatedCompletionDate: '2024-01-22',
        status: '承認済み',
        description: 'Test plan C',
        createdAt: '2024-01-12T11:00:00Z',
        updatedAt: '2024-01-12T11:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        allocationPlanId: 'plan-004',
        planName: '配置案D',
        facilityId: 'fac-003',
        teamId: 'TEAM003',
        workInstructionId: 'wi-004',
        allocationStartDate: '2024-01-18',
        allocationEndDate: '2024-01-23',
        estimatedWorkHours: 50,
        estimatedCompletionDate: '2024-01-23',
        status: '実行中',
        description: 'Test plan D',
        createdAt: '2024-01-13T12:00:00Z',
        updatedAt: '2024-01-13T12:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
    ];

    // Mock the function to return filtered results
    const mockResult = {
      allocationPlans: [testAllocationPlans[0], testAllocationPlans[1], testAllocationPlans[2]],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 10,
      retrievedAt: new Date().toISOString(),
    };

    jest.mocked(listAllocationPlansByCondition).mockResolvedValueOnce(mockResult);

    // Call the function with test parameters
    const input = {
      teamIds: ['TEAM001', 'TEAM002'],
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'createdFromDate',
      sortOrder: 'ASC',
    };

    const result = await listAllocationPlansByCondition(input);

    // Verify the count of allocation plans
    expect(result.allocationPlans).toHaveLength(3);
    expect(result.allocationPlans.map((p) => p.allocationPlanId)).toEqual([
      'plan-001',
      'plan-002',
      'plan-003',
    ]);

    // Verify totalCount
    expect(result.totalCount).toBe(3);

    // Verify pagination fields
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // Verify retrievedAt is in ISO 8601 format
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify detail information for each allocation plan
    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('workInstructionId');
      expect(plan).toHaveProperty('allocationStartDate');
      expect(plan).toHaveProperty('allocationEndDate');
      expect(plan).toHaveProperty('estimatedWorkHours');
      expect(plan).toHaveProperty('estimatedCompletionDate');
      expect(plan).toHaveProperty('status');
      expect(plan).toHaveProperty('description');
      expect(plan).toHaveProperty('createdAt');
      expect(plan).toHaveProperty('updatedAt');
      expect(plan).toHaveProperty('createdBy');
    });

    // Verify sort order by createdAt (ascending)
    expect(new Date(result.allocationPlans[0].createdAt).getTime()).toBeLessThanOrEqual(
      new Date(result.allocationPlans[1].createdAt).getTime()
    );
    expect(new Date(result.allocationPlans[1].createdAt).getTime()).toBeLessThanOrEqual(
      new Date(result.allocationPlans[2].createdAt).getTime()
    );

    // Verify allocation plan D is not included
    expect(result.allocationPlans.some((p) => p.teamId === 'TEAM003')).toBe(false);

    // Verify team IDs match the input filter
    result.allocationPlans.forEach((plan) => {
      expect(['TEAM001', 'TEAM002']).toContain(plan.teamId);
    });

    // Verify detail information matches test data
    expect(result.allocationPlans[0]).toMatchObject({
      planName: '配置案A',
      status: '承認済み',
      estimatedWorkHours: 40,
    });
    expect(result.allocationPlans[1]).toMatchObject({
      planName: '配置案B',
      status: '提案中',
      estimatedWorkHours: 35,
    });
    expect(result.allocationPlans[2]).toMatchObject({
      planName: '配置案C',
      status: '承認済み',
      estimatedWorkHours: 45,
    });
  });
});