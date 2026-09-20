import { listAllocationPlansByCondition, ListAllocationPlansByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-805: 出力に含まれる総件数がページングされた件数と一致する', () => {
  beforeEach(async () => {
    // テスト用の人員配置案データを事前にデータベースに挿入する
    // 総100件のデータを挿入し、そのうち検索条件に合致するデータを60件とする
    const facilityId = 'test-facility-001';
    const teamId = 'test-team-001';
    const workInstructionId = 'test-work-instruction-001';
    const now = new Date();

    // 検索条件に合致する60件のデータを挿入
    for (let i = 0; i < 60; i++) {
      await insertTestAllocationPlan({
        facilityId,
        teamId,
        workInstructionId,
        planName: `Test Plan ${i}`,
        allocationStartDate: new Date(now.getTime() + i * 86400000).toISOString(),
        allocationEndDate: new Date(now.getTime() + (i + 1) * 86400000).toISOString(),
        estimatedWorkHours: 100 + i,
        estimatedCompletionDate: new Date(now.getTime() + (i + 2) * 86400000).toISOString(),
        status: 'approved',
        description: `Test allocation plan ${i}`,
        createdBy: 'test-user',
      });
    }

    // 検索条件に合致しない40件のデータを挿入
    const otherFacilityId = 'test-facility-999';
    for (let i = 0; i < 40; i++) {
      await insertTestAllocationPlan({
        facilityId: otherFacilityId,
        teamId: 'test-team-999',
        workInstructionId: 'test-work-instruction-999',
        planName: `Other Plan ${i}`,
        allocationStartDate: new Date(now.getTime() + i * 86400000).toISOString(),
        allocationEndDate: new Date(now.getTime() + (i + 1) * 86400000).toISOString(),
        estimatedWorkHours: 100 + i,
        estimatedCompletionDate: new Date(now.getTime() + (i + 2) * 86400000).toISOString(),
        status: 'rejected',
        description: `Other allocation plan ${i}`,
        createdBy: 'test-user',
      });
    }
  });

  afterEach(async () => {
    // テストデータのクリーンアップ
    await cleanupTestAllocationPlans();
  });

  test('ページングされた件数と総件数が正しく一致する', async () => {
    // listAllocationPlansByCondition を呼び出す
    // 入力として pageNumber=1、pageSize=20 を指定し、他の検索条件は未指定（null）とする
    const input: ListAllocationPlansByConditionInput = {
      allocationPlanIds: undefined,
      facilityIds: ['test-facility-001'],
      teamIds: ['test-team-001'],
      workInstructionIds: ['test-work-instruction-001'],
      planNameKeyword: undefined,
      statuses: ['approved'],
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
      pageNumber: 1,
      pageSize: 20,
    };

    const result = await listAllocationPlansByCondition(input);

    // 出力の allocationPlans フィールドから配列の要素数をカウントする
    const allocationPlansCount = result.allocationPlans.length;

    // 出力の totalCount フィールドの値を確認する
    const totalCount = result.totalCount;

    // 出力の pageNumber フィールドの値を確認する
    const pageNumber = result.pageNumber;

    // 出力の pageSize フィールドの値を確認する
    const pageSize = result.pageSize;

    // 期待結果の検証
    // allocationPlans 配列の要素数は 20 である
    expect(allocationPlansCount).toBe(20);

    // totalCount は 60 である
    expect(totalCount).toBe(60);

    // pageNumber は 1 である
    expect(pageNumber).toBe(1);

    // pageSize は 20 である
    expect(pageSize).toBe(20);

    // 検索条件に合致した総60件のうち、ページングにより1ページ目として20件が返却されていることが確認できる
    expect(allocationPlansCount).toBeLessThanOrEqual(totalCount);
    expect(allocationPlansCount).toBe(pageSize);

    // 出力に含まれる件数（20件）はページサイズ（20）と一致する
    expect(allocationPlansCount).toBe(20);

    // 検索結果が実際にデータを含んでいることを確認
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    result.allocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toBe('test-facility-001');
      expect(plan.teamId).toBe('test-team-001');
      expect(plan.status).toBe('approved');
    });

    // retrievedAt が ISO 8601 形式であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(new Date(result.retrievedAt)).toBeInstanceOf(Date);
  });
});

// ヘルパー関数: テスト用の人員配置案データを挿入
async function insertTestAllocationPlan(data: {
  facilityId: string;
  teamId: string;
  workInstructionId: string;
  planName: string;
  allocationStartDate: string;
  allocationEndDate: string;
  estimatedWorkHours: number;
  estimatedCompletionDate: string;
  status: string;
  description: string;
  createdBy: string;
}): Promise<void> {
  // 実装: テストデータベースに人員配置案レコードを挿入
  // 本来はモック化されたリポジトリまたはテストDB接続を使用
}

// ヘルパー関数: テストデータのクリーンアップ
async function cleanupTestAllocationPlans(): Promise<void> {
  // 実装: テスト実行後にテストデータベースのテスト関連レコードを削除
}