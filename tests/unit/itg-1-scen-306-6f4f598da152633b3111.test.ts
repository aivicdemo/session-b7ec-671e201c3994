import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

// Mock dependencies for supporting functions
jest.mock('../../src/logic/allocation-plan-review-approval', () => {
  const actual = jest.requireActual('../../src/logic/allocation-plan-review-approval');
  return {
    ...actual,
    extractAndRankAllocationPlansForReview: jest.fn(actual.extractAndRankAllocationPlansForReview),
  };
});

// Mock external dependencies
jest.mock('../../src/adapters/authorization-adapter', () => ({
  authorizeOperation: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/adapters/datetime-validator-adapter', () => ({
  validateDateTimeRange: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/adapters/allocation-data-adapter', () => ({
  listAllocationPlansByCondition: jest.fn(),
  getRecentDelayRiskJudgmentByFacilityAndTeam: jest.fn(),
  getLatestProductivityDataByWorker: jest.fn(),
}));

jest.mock('../../src/adapters/audit-adapter', () => ({
  recordOperationAudit: jest.fn().mockResolvedValue(true),
}));

describe('SCEN-306: 優先度フィルタが low の場合の配置案抽出テスト', () => {
  let mockListAllocationPlans: jest.Mock;
  let mockGetDelayRiskJudgment: jest.Mock;
  let mockGetProductivityData: jest.Mock;
  let mockRecordAudit: jest.Mock;
  let mockAuthorize: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mock functions
    const allocationDataAdapter = require('../../src/adapters/allocation-data-adapter');
    const auditAdapter = require('../../src/adapters/audit-adapter');
    const authAdapter = require('../../src/adapters/authorization-adapter');
    const datetimeAdapter = require('../../src/adapters/datetime-validator-adapter');

    mockListAllocationPlans = allocationDataAdapter.listAllocationPlansByCondition;
    mockGetDelayRiskJudgment = allocationDataAdapter.getRecentDelayRiskJudgmentByFacilityAndTeam;
    mockGetProductivityData = allocationDataAdapter.getLatestProductivityDataByWorker;
    mockRecordAudit = auditAdapter.recordOperationAudit;
    mockAuthorize = authAdapter.authorizeOperation;
    mockValidateDateTimeRange = datetimeAdapter.validateDateTimeRange;
  });

  it('優先度フィルタが low の場合、優先度が low のみの配置案が返される', async () => {
    // テスト入力値の準備
    const userId = 'user-center-manager-001';
    const targetFacilityIds = ['facility-001', 'facility-002'];
    const timeRangeStart = '2024-01-01T08:00:00Z';
    const timeRangeEnd = '2024-01-01T18:00:00Z';
    const priorityFilter = 'low';
    const maxResultCount = 50;

    // authorizeOperation（スタブ）を設定し、ユーザーIDが物流センター長権限を持つことを前提とする
    mockAuthorize.mockResolvedValue(true);

    // validateDateTimeRange（スタブ）を設定し、時間帯の開始時刻が終了時刻より前であることを確認可能にする
    mockValidateDateTimeRange.mockResolvedValue(true);

    // listAllocationPlansByCondition（スタブ）を設定し、以下の配置案データセットを返すよう構成する：
    // 候補1（優先度='low'、riskScore=0.3）、候補2（優先度='low'、riskScore=0.4）、
    // 候補3（優先度='medium'、riskScore=0.6）、候補4（優先度='high'、riskScore=0.8）
    const allPlansBeforeFilter = [
      {
        allocationPlanId: 'plan-low-001',
        planName: '候補1',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 3,
        plannedStartDate: '2024-01-02T08:00:00Z',
        plannedEndDate: '2024-01-02T18:00:00Z',
        expectedCompletionDate: '2024-01-03T17:00:00Z',
        currentProgressRate: 45,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 30,
        predictedDelayDays: 0,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 88,
        recommendationReason: '優先度が低く実行可能性が高い案',
        rankingPriority: 1,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-low-002',
        planName: '候補2',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 2,
        plannedStartDate: '2024-01-02T09:00:00Z',
        plannedEndDate: '2024-01-02T19:00:00Z',
        expectedCompletionDate: '2024-01-03T18:00:00Z',
        currentProgressRate: 50,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 40,
        predictedDelayDays: 0,
        feasibilityScore: 80,
        averageWorkerProductivityRate: 85,
        recommendationReason: '優先度が低く実行可能性が十分な案',
        rankingPriority: 2,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-medium-003',
        planName: '候補3',
        facilityId: 'facility-001',
        teamId: 'team-003',
        workInstructionId: 'work-003',
        allocatedWorkerCount: 4,
        plannedStartDate: '2024-01-02T08:00:00Z',
        plannedEndDate: '2024-01-02T18:00:00Z',
        expectedCompletionDate: '2024-01-03T17:00:00Z',
        currentProgressRate: 30,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 60,
        predictedDelayDays: 1,
        feasibilityScore: 70,
        averageWorkerProductivityRate: 75,
        recommendationReason: '優先度が中程度の案',
        rankingPriority: 3,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-high-004',
        planName: '候補4',
        facilityId: 'facility-002',
        teamId: 'team-004',
        workInstructionId: 'work-004',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-02T09:00:00Z',
        plannedEndDate: '2024-01-02T19:00:00Z',
        expectedCompletionDate: '2024-01-03T18:00:00Z',
        currentProgressRate: 20,
        delayRiskLevel: 'high' as const,
        delayRiskScore: 80,
        predictedDelayDays: 2,
        feasibilityScore: 60,
        averageWorkerProductivityRate: 65,
        recommendationReason: '優先度が高く急対応が必要な案',
        rankingPriority: 4,
        status: 'pending_review' as const,
      },
    ];

    mockListAllocationPlans.mockResolvedValue(allPlansBeforeFilter);

    // getRecentDelayRiskJudgmentByFacilityAndTeam（スタブ）を設定し、
    // 各配置案の対象拠点・チームの納期リスク判定データを返すよう構成する
    mockGetDelayRiskJudgment.mockImplementation(async ({ facilityId, teamId }) => ({
      facilityId,
      teamId,
      riskLevel: 'low',
      predictedDelayDays: 0,
      lastUpdated: '2024-01-01T19:50:00Z',
    }));

    // getLatestProductivityDataByWorker（スタブ）を設定し、
    // 各配置案に含まれる作業者の生産性データを返すよう構成する
    mockGetProductivityData.mockImplementation(async ({ workerId }) => ({
      workerId,
      productivityRate: 85,
      qualityScore: 90,
      lastUpdated: '2024-01-01T19:40:00Z',
    }));

    // recordOperationAudit（スタブ）を設定し、操作監査ログの記録を許容する
    mockRecordAudit.mockResolvedValue(true);

    // 実際の関数を呼び出す
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // allocationPlansが配列であることを確認
    expect(Array.isArray(result.allocationPlans)).toBe(true);

    // allocationPlansに含まれる配置案が全て優先度フィルタ='low'の条件を満たしていることを確認
    // 候補1と候補2のみが返され、候補3と候補4は除外されることを確認
    expect(result.allocationPlans.length).toBe(2);
    
    const returnedPlanIds = result.allocationPlans.map(plan => plan.allocationPlanId);
    expect(returnedPlanIds).toContain('plan-low-001');
    expect(returnedPlanIds).toContain('plan-low-002');
    expect(returnedPlanIds).not.toContain('plan-medium-003');
    expect(returnedPlanIds).not.toContain('plan-high-004');

    for (const plan of result.allocationPlans) {
      // 配置案のステータスが対象範囲内であることを確認
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(
        plan.status
      );

      // 各RankedAllocationPlanForReviewオブジェクトが必須フィールドを持つことを確認
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('workInstructionId');
      expect(plan).toHaveProperty('allocatedWorkerCount');
      expect(plan).toHaveProperty('plannedStartDate');
      expect(plan).toHaveProperty('plannedEndDate');
      expect(plan).toHaveProperty('expectedCompletionDate');
      expect(plan).toHaveProperty('currentProgressRate');
      expect(plan).toHaveProperty('delayRiskLevel');
      expect(plan).toHaveProperty('delayRiskScore');
      expect(plan).toHaveProperty('predictedDelayDays');
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('averageWorkerProductivityRate');
      expect(plan).toHaveProperty('recommendationReason');
      expect(plan).toHaveProperty('rankingPriority');
      expect(plan).toHaveProperty('status');

      // フィールドの型を検証
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(typeof plan.planName).toBe('string');
      expect(typeof plan.facilityId).toBe('string');
      expect(typeof plan.teamId).toBe('string');
      expect(typeof plan.workInstructionId).toBe('string');
      expect(typeof plan.allocatedWorkerCount).toBe('number');
      expect(typeof plan.plannedStartDate).toBe('string');
      expect(typeof plan.plannedEndDate).toBe('string');
      expect(typeof plan.expectedCompletionDate).toBe('string');
      expect(typeof plan.currentProgressRate).toBe('number');
      expect(['critical', 'high', 'medium', 'low']).toContain(
        plan.delayRiskLevel
      );
      expect(typeof plan.delayRiskScore).toBe('number');
      expect(typeof plan.predictedDelayDays).toBe('number');
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(typeof plan.averageWorkerProductivityRate).toBe('number');
      expect(typeof plan.recommendationReason).toBe('string');
      expect(typeof plan.rankingPriority).toBe('number');
    }

    // allocationPlansが優先度スコア（rankingPriority）の降順に並べられていることを確認
    for (let i = 1; i < result.allocationPlans.length; i++) {
      expect(result.allocationPlans[i - 1].rankingPriority).toBeGreaterThanOrEqual(
        result.allocationPlans[i].rankingPriority
      );
    }

    // totalCountが返されることを確認
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    // priorityFilter='low'の条件に合致する配置案の総件数が2であることを確認
    expect(result.totalCount).toBe(2);

    // analysisCompletedAtがISO 8601形式の有効な日時文字列であることを確認
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(() => new Date(result.analysisCompletedAt)).not.toThrow();
    expect(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.?\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(
        result.analysisCompletedAt
      )
    ).toBe(true);

    // dataFreshnessが期待される構造を持つことを確認
    expect(result.dataFreshness).toHaveProperty('progressDataAge');
    expect(result.dataFreshness).toHaveProperty('productivityDataAge');
    expect(result.dataFreshness).toHaveProperty('riskJudgmentAge');

    // dataFreshnessの各フィールドが非負整数（秒単位）であることを確認
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.dataFreshness.progressDataAge)).toBe(true);

    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.dataFreshness.productivityDataAge)).toBe(
      true
    );

    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.dataFreshness.riskJudgmentAge)).toBe(true);

    // 権限検証がスタブで呼び出されたことを確認
    expect(mockAuthorize).toHaveBeenCalledWith(userId, 'logistics_center_manager');

    // 時間帯検証がスタブで呼び出されたことを確認
    expect(mockValidateDateTimeRange).toHaveBeenCalledWith(
      timeRangeStart,
      timeRangeEnd
    );

    // リスト取得がスタブで呼び出されたことを確認
    expect(mockListAllocationPlans).toHaveBeenCalled();

    // 監査ログ記録がスタブで呼び出されたことを確認
    expect(mockRecordAudit).toHaveBeenCalled();
  });
});