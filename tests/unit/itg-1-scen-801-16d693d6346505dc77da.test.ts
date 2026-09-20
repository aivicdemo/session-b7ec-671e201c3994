import { ListAllocationPlansByConditionInput, ListAllocationPlansByConditionOutput } from '../../src/logic/data-persistence';
import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-801: 複数の人員配置案IDを指定した場合に合致する配置案を取得できる', () => {
  it('should retrieve allocation plans matching specified IDs and return complete details', async () => {
    // テスト用の複数の配置案IDを準備
    const specifiedPlanIds = ['plan-001', 'plan-002', 'plan-003'];

    // 入力条件を構築：指定された配置案IDのみを条件とし、他はすべてnull/undefined
    const input: ListAllocationPlansByConditionInput = {
      allocationPlanIds: specifiedPlanIds,
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

    // 関数を実行
    const result: ListAllocationPlansByConditionOutput = await listAllocationPlansByCondition(input);

    // 1. allocationPlans 配列が返却されることを確認
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);

    // 2. 指定した allocationPlanIds に完全に合致するデータのみが含まれることを確認
    const returnedIds = result.allocationPlans.map((plan) => plan.allocationPlanId);
    expect(returnedIds).toEqual(expect.arrayContaining(specifiedPlanIds));
    // 指定されたID以外が含まれないことを確認
    returnedIds.forEach((id) => {
      expect(specifiedPlanIds).toContain(id);
    });

    // 3. 各配置案オブジェクトが必須フィールドをすべて保有することを確認
    result.allocationPlans.forEach((plan) => {
      // 配置案ID
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');

      // 配置案名
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');

      // 拠点ID
      expect(plan.facilityId).toBeDefined();
      expect(typeof plan.facilityId).toBe('string');

      // チームID
      expect(plan.teamId).toBeDefined();
      expect(typeof plan.teamId).toBe('string');

      // 作業指示ID（対象作業）
      expect(plan.workInstructionId).toBeDefined();
      expect(typeof plan.workInstructionId).toBe('string');

      // 配置開始日（配置期間）
      expect(plan.allocationStartDate).toBeDefined();
      expect(typeof plan.allocationStartDate).toBe('string');

      // 配置終了日（配置期間）
      expect(plan.allocationEndDate).toBeDefined();
      expect(typeof plan.allocationEndDate).toBe('string');

      // 予想工数
      expect(plan.estimatedWorkHours).toBeDefined();
      expect(typeof plan.estimatedWorkHours).toBe('number');
      expect(plan.estimatedWorkHours).toBeGreaterThanOrEqual(0);

      // 予想完了日
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(typeof plan.estimatedCompletionDate).toBe('string');

      // 実行ステータス
      expect(plan.status).toBeDefined();
      expect(typeof plan.status).toBe('string');

      // 説明（オプションだが存在する可能性）
      if (plan.description !== undefined) {
        expect(typeof plan.description).toBe('string');
      }

      // 作成日時
      expect(plan.createdAt).toBeDefined();
      expect(typeof plan.createdAt).toBe('string');

      // 更新日時
      expect(plan.updatedAt).toBeDefined();
      expect(typeof plan.updatedAt).toBe('string');

      // 作成者
      expect(plan.createdBy).toBeDefined();
      expect(typeof plan.createdBy).toBe('string');

      // 更新者（オプション）
      if (plan.updatedBy !== undefined) {
        expect(typeof plan.updatedBy).toBe('string');
      }
    });

    // 4. totalCount が指定したIDに合致した配置案の正確な件数と一致することを確認
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBe(result.allocationPlans.length);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // 5. retrievedAt が ISO 8601形式の有効なタイムスタンプであることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // ISO 8601形式の基本的な検証
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
    // 有効なタイムスタンプとしてパースできることを確認
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeGreaterThan(0);

    // 6. ページング条件が指定されていないため pageNumber と pageSize は出力されない
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });
});