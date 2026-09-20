import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-797: ページネーション指定時に指定ページの配置案のみを取得できる', () => {
  it('pageNumber=2、pageSize=10で検索した場合、ページ2の配置案11～20のみが返される', async () => {
    const mockAllocationPlans = Array.from({ length: 30 }, (_, i) => ({
      allocationPlanId: `plan-${i + 1}`,
      planName: `配置案${i + 1}`,
      facilityId: `facility-${(i % 3) + 1}`,
      teamId: `team-${(i % 5) + 1}`,
      workInstructionId: `work-${(i % 7) + 1}`,
      allocationStartDate: '2024-01-01',
      allocationEndDate: '2024-01-31',
      estimatedWorkHours: 100 + i * 5,
      estimatedCompletionDate: '2024-01-15',
      status: i % 3 === 0 ? '提案中' : i % 3 === 1 ? '承認済み' : '実行中',
      description: `配置案の説明${i + 1}`,
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-01T09:00:00Z',
      createdBy: 'user-1',
      updatedBy: null,
    }));

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        allocationPlans: mockAllocationPlans.slice(10, 20),
        totalCount: 30,
        pageNumber: 2,
        pageSize: 10,
        retrievedAt: new Date().toISOString(),
      }),
    } as Response);

    const result = await listAllocationPlansByCondition({
      allocationPlanIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workInstructionIds: undefined,
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
      pageNumber: 2,
      pageSize: 10,
    });

    expect(result.allocationPlans).toHaveLength(10);
    expect(result.allocationPlans[0].allocationPlanId).toBe('plan-11');
    expect(result.allocationPlans[9].allocationPlanId).toBe('plan-20');
    expect(result.totalCount).toBe(30);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    for (let i = 0; i < result.allocationPlans.length; i++) {
      expect(result.allocationPlans[i].allocationPlanId).toBe(`plan-${11 + i}`);
    }
  });
});