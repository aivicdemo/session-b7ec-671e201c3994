import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';
import { ListAllocationPlansByConditionInput, ListAllocationPlansByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-783: 代表的な検索条件で人員配置案一覧を正常に取得できる', () => {
  it('should retrieve allocation plan list matching representative search conditions', async () => {
    // 準備: テスト用の代表的な検索条件を準備
    const input: ListAllocationPlansByConditionInput = {
      facilityIds: ['facility001', 'facility002'],
      teamIds: ['team001'],
      statuses: ['実行中', '完了'],
      allocationStartFromDate: '2024-01-01',
      allocationStartToDate: '2024-12-31',
      sortBy: 'allocationStartDate',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 20,
    };

    // 実行: listAllocationPlansByConditionを呼び出す
    const result: ListAllocationPlansByConditionOutput = await listAllocationPlansByCondition(input);

    // 検証: 関数が正常にListAllocationPlansByConditionOutput型の結果を返すことを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('retrievedAt');

    // 検証: allocationPlansフィールドが配列であることを確認
    expect(Array.isArray(result.allocationPlans)).toBe(true);

    // 検証: 各要素がGetAllocationPlanByIdOutput型の人員配置案詳細情報を保持
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
      expect(plan).toHaveProperty('createdAt');
      expect(plan).toHaveProperty('updatedAt');
    });

    // 検証: 各配置案が検索条件に合致
    result.allocationPlans.forEach((plan) => {
      expect(['facility001', 'facility002']).toContain(plan.facilityId);
      expect(plan.teamId).toBe('team001');
      expect(['実行中', '完了']).toContain(plan.status);
      expect(new Date(plan.allocationStartDate).getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
      expect(new Date(plan.allocationStartDate).getTime()).toBeLessThanOrEqual(new Date('2024-12-31').getTime());
    });

    // 検証: allocationPlansがsortBy='allocationStartDate'、sortOrder='ASC'に基づいて昇順
    for (let i = 1; i < result.allocationPlans.length; i++) {
      const prevDate = new Date(result.allocationPlans[i - 1].allocationStartDate).getTime();
      const currDate = new Date(result.allocationPlans[i].allocationStartDate).getTime();
      expect(currDate).toBeGreaterThanOrEqual(prevDate);
    }

    // 検証: totalCountが検索条件に合致した配置案の総件数
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // 検証: pageNumberが1
    expect(result.pageNumber).toBe(1);

    // 検証: pageSizeが20
    expect(result.pageSize).toBe(20);

    // 検証: retrievedAtがISO 8601形式のタイムスタンプ
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 検証: 返却される配置案件数が20件以下
    expect(result.allocationPlans.length).toBeLessThanOrEqual(20);

    // 検証: 返却される配置案件数がtotalCountを超えない
    expect(result.allocationPlans.length).toBeLessThanOrEqual(result.totalCount);
  });
});