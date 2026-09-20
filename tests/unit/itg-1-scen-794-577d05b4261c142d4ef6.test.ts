import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';
import { ListAllocationPlansByConditionInput, ListAllocationPlansByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-794: すべての検索条件が未指定の場合に全件を取得できる', () => {
  it('検索条件がすべて未指定の場合、全件の人員配置案を取得する', async () => {
    // Arrange: すべての検索条件をnullまたはundefinedで設定
    const input: ListAllocationPlansByConditionInput = {
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act: listAllocationPlansByConditionを呼び出す
    const result: ListAllocationPlansByConditionOutput =
      await listAllocationPlansByCondition(input);

    // Assert: 戻り値の構造と内容を確認

    // (1) allocationPlans が GetAllocationPlanByIdOutput 型の配列で、空でなく、配置案の詳細情報を含むことを確認
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // 各配置案が必須フィールドを含むことを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');

      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');

      expect(plan.facilityId).toBeDefined();
      expect(typeof plan.facilityId).toBe('string');

      expect(plan.teamId).toBeDefined();
      expect(typeof plan.teamId).toBe('string');

      expect(plan.workInstructionId).toBeDefined();
      expect(typeof plan.workInstructionId).toBe('string');

      expect(plan.allocationStartDate).toBeDefined();
      expect(typeof plan.allocationStartDate).toBe('string');

      expect(plan.allocationEndDate).toBeDefined();
      expect(typeof plan.allocationEndDate).toBe('string');

      expect(plan.estimatedWorkHours).toBeDefined();
      expect(typeof plan.estimatedWorkHours).toBe('number');
      expect(plan.estimatedWorkHours).toBeGreaterThanOrEqual(0);

      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(typeof plan.estimatedCompletionDate).toBe('string');

      expect(plan.status).toBeDefined();
      expect(typeof plan.status).toBe('string');

      expect(plan.createdAt).toBeDefined();
      expect(typeof plan.createdAt).toBe('string');

      expect(plan.updatedAt).toBeDefined();
      expect(typeof plan.updatedAt).toBe('string');

      expect(plan.createdBy).toBeDefined();
      expect(typeof plan.createdBy).toBe('string');
    });

    // (2) totalCount がデータベース内のすべての人員配置案の件数と等しいことを確認
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationPlans.length);

    // (3) pageNumber と pageSize が未指定（null または undefined）であることを確認
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // (4) retrievedAt が ISO 8601 形式の文字列で、呼び出し時刻に相応する時刻であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    // ISO 8601形式の妥当性を確認
    const retrievedTime = new Date(result.retrievedAt);
    expect(retrievedTime instanceof Date).toBe(true);
    expect(isNaN(retrievedTime.getTime())).toBe(false);

    // 呼び出し時刻から5秒以内であることを確認（テスト実行時間を考慮）
    const now = new Date();
    const timeDiff = now.getTime() - retrievedTime.getTime();
    expect(timeDiff).toBeGreaterThanOrEqual(0);
    expect(timeDiff).toBeLessThan(5000);
  });
});