import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-799: 配置案名に対する部分一致キーワード検索で該当する配置案を取得できる', () => {
  let testAllocationPlans: any[];

  beforeEach(async () => {
    // テストデータの作成
    testAllocationPlans = [
      {
        allocationPlanId: 'plan-001',
        planName: '春季営業キャンペーン人員配置',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocationStartDate: '2024-04-01',
        allocationEndDate: '2024-04-30',
        estimatedWorkHours: 120,
        estimatedCompletionDate: '2024-04-30',
        status: '提案中',
        description: 'Spring campaign staffing',
        createdAt: '2024-03-15T10:00:00Z',
        updatedAt: '2024-03-15T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        allocationPlanId: 'plan-002',
        planName: '春季在庫整理案件',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocationStartDate: '2024-04-15',
        allocationEndDate: '2024-05-15',
        estimatedWorkHours: 80,
        estimatedCompletionDate: '2024-05-15',
        status: '承認済み',
        description: 'Spring inventory adjustment',
        createdAt: '2024-03-10T09:00:00Z',
        updatedAt: '2024-03-10T09:00:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        allocationPlanId: 'plan-003',
        planName: '夏季キャンペーン準備',
        facilityId: 'facility-003',
        teamId: 'team-003',
        workInstructionId: 'work-003',
        allocationStartDate: '2024-06-01',
        allocationEndDate: '2024-06-30',
        estimatedWorkHours: 150,
        estimatedCompletionDate: '2024-06-30',
        status: '実行中',
        description: 'Summer campaign preparation',
        createdAt: '2024-05-01T14:00:00Z',
        updatedAt: '2024-05-01T14:00:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
    ];
  });

  it('キーワード「春季」で部分一致検索した場合、春季を含む配置案のみが返される', async () => {
    const input = {
      planNameKeyword: '春季',
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      pageNumber: undefined,
      pageSize: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    const result = await listAllocationPlansByCondition(input);

    // 戻り値が存在することを確認
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);

    // 該当する配置案が含まれていることを確認
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    const planNames = result.allocationPlans.map((plan: any) => plan.planName);
    expect(planNames).toContain('春季営業キャンペーン人員配置');
    expect(planNames).toContain('春季在庫整理案件');

    // 該当しない配置案が含まれていないことを確認
    expect(planNames).not.toContain('夏季キャンペーン準備');
  });

  it('totalCount は検索条件に合致した配置案の総件数を返す', async () => {
    const input = {
      planNameKeyword: '春季',
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      pageNumber: undefined,
      pageSize: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    const result = await listAllocationPlansByCondition(input);

    expect(result.totalCount).toBe(2);
  });

  it('retrievedAt は ISO 8601 形式の現在日時を返す', async () => {
    const input = {
      planNameKeyword: '春季',
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      pageNumber: undefined,
      pageSize: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    const result = await listAllocationPlansByCondition(input);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // ISO 8601形式の検証（基本的なフォーマット確認）
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });

  it('各配置案には詳細情報（ID、名称、対象作業、配置期間、予想工数、実行ステータス）が格納されている', async () => {
    const input = {
      planNameKeyword: '春季',
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      pageNumber: undefined,
      pageSize: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    const result = await listAllocationPlansByCondition(input);

    const plan = result.allocationPlans.find(
      (p: any) => p.planName === '春季営業キャンペーン人員配置'
    );

    expect(plan).toBeDefined();
    expect(plan.allocationPlanId).toBeDefined();
    expect(plan.planName).toBe('春季営業キャンペーン人員配置');
    expect(plan.workInstructionId).toBeDefined();
    expect(plan.allocationStartDate).toBeDefined();
    expect(plan.allocationEndDate).toBeDefined();
    expect(plan.estimatedWorkHours).toBe(120);
    expect(plan.status).toBe('提案中');
  });
});