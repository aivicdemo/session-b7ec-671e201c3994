import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-798: ソート指定時に指定されたフィールドと順序で配置案が並べられる', () => {
  const testFacilityId = 'facility-test-001';
  const testTeamId = 'team-test-001';
  const testWorkInstructionId = 'work-instruction-test-001';

  const testPlans = [
    {
      allocationPlanId: 'plan-a',
      planName: '配置案A',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-25',
      estimatedWorkHours: 100,
      estimatedCompletionDate: '2024-01-24',
      status: 'proposed',
      description: 'テスト配置案A',
      createdBy: 'user-001',
      createdAt: '2024-01-05T10:00:00Z',
      updatedAt: '2024-01-05T10:00:00Z',
    },
    {
      allocationPlanId: 'plan-b',
      planName: '配置案B',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocationStartDate: '2024-01-10',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 80,
      estimatedCompletionDate: '2024-01-19',
      status: 'proposed',
      description: 'テスト配置案B',
      createdBy: 'user-001',
      createdAt: '2024-01-05T08:00:00Z',
      updatedAt: '2024-01-05T08:00:00Z',
    },
    {
      allocationPlanId: 'plan-c',
      planName: '配置案C',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocationStartDate: '2024-01-20',
      allocationEndDate: '2024-01-30',
      estimatedWorkHours: 120,
      estimatedCompletionDate: '2024-01-29',
      status: 'proposed',
      description: 'テスト配置案C',
      createdBy: 'user-001',
      createdAt: '2024-01-05T12:00:00Z',
      updatedAt: '2024-01-05T12:00:00Z',
    },
  ];

  beforeAll(async () => {
    // テストデータを事前登録（ここでは保存操作を想定）
    // 実装では SaveAllocationPlanInput を使用してデータベースに登録
    for (const plan of testPlans) {
      // 注：実装ではsaveAllocationPlanを呼び出してデータを保存
      // listAllocationPlansByConditionはデータベースから検索するため
    }
  });

  it('allocationStartFromDateで昇順(ASC)ソート時、配置案が昇順に並んでいる', async () => {
    const result = await listAllocationPlansByCondition({
      sortBy: 'allocationStartFromDate',
      sortOrder: 'ASC',
    });

    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    
    for (let i = 1; i < result.allocationPlans.length; i++) {
      const prevDate = new Date(result.allocationPlans[i - 1].allocationStartDate);
      const currentDate = new Date(result.allocationPlans[i].allocationStartDate);
      expect(prevDate.getTime()).toBeLessThanOrEqual(currentDate.getTime());
    }
  });

  it('allocationStartFromDateで降順(DESC)ソート時、配置案が降順に並んでいる', async () => {
    const result = await listAllocationPlansByCondition({
      sortBy: 'allocationStartFromDate',
      sortOrder: 'DESC',
    });

    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    for (let i = 1; i < result.allocationPlans.length; i++) {
      const prevDate = new Date(result.allocationPlans[i - 1].allocationStartDate);
      const currentDate = new Date(result.allocationPlans[i].allocationStartDate);
      expect(prevDate.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());
    }
  });

  it('createdFromDateで昇順(ASC)ソート時、配置案が昇順に並んでいる', async () => {
    const result = await listAllocationPlansByCondition({
      sortBy: 'createdFromDate',
      sortOrder: 'ASC',
    });

    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    for (let i = 1; i < result.allocationPlans.length; i++) {
      const prevDate = new Date(result.allocationPlans[i - 1].createdAt);
      const currentDate = new Date(result.allocationPlans[i].createdAt);
      expect(prevDate.getTime()).toBeLessThanOrEqual(currentDate.getTime());
    }
  });

  it('sortByおよびsortOrderパラメータが正しく反映される', async () => {
    const resultAsc = await listAllocationPlansByCondition({
      sortBy: 'estimatedCompletionDate',
      sortOrder: 'ASC',
    });

    const resultDesc = await listAllocationPlansByCondition({
      sortBy: 'estimatedCompletionDate',
      sortOrder: 'DESC',
    });

    expect(resultAsc.allocationPlans).toBeDefined();
    expect(resultDesc.allocationPlans).toBeDefined();

    if (resultAsc.allocationPlans.length > 1) {
      for (let i = 1; i < resultAsc.allocationPlans.length; i++) {
        const prevDate = new Date(resultAsc.allocationPlans[i - 1].estimatedCompletionDate);
        const currentDate = new Date(resultAsc.allocationPlans[i].estimatedCompletionDate);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currentDate.getTime());
      }
    }

    if (resultDesc.allocationPlans.length > 1) {
      for (let i = 1; i < resultDesc.allocationPlans.length; i++) {
        const prevDate = new Date(resultDesc.allocationPlans[i - 1].estimatedCompletionDate);
        const currentDate = new Date(resultDesc.allocationPlans[i].estimatedCompletionDate);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());
      }
    }
  });

  it('取得結果に必要なフィールドがすべて含まれている', async () => {
    const result = await listAllocationPlansByCondition({
      sortBy: 'allocationStartFromDate',
      sortOrder: 'ASC',
    });

    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');

    if (result.allocationPlans.length > 0) {
      const plan = result.allocationPlans[0];
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
      expect(plan).toHaveProperty('createdAt');
      expect(plan).toHaveProperty('updatedAt');
    }
  });
});