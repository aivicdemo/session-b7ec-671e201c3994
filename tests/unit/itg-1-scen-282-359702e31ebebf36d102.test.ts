import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-282: extractAndRankAllocationPlansForReview', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockListAllocationPlansByCondition: jest.Mock;
  let mockGetRecentDelayRiskJudgment: jest.Mock;
  let mockGetLatestProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockValidateDateTimeRange = jest.fn().mockResolvedValue({ valid: true });
    mockListAllocationPlansByCondition = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'plan-001',
        planName: 'Plan A',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-01T08:00:00Z',
        plannedEndDate: '2024-01-01T17:00:00Z',
        expectedCompletionDate: '2024-01-02T10:00:00Z',
        currentProgressRate: 45,
        delayRiskScore: 75,
        feasibilityScore: 82,
        proposedWorkers: ['worker-001', 'worker-002'],
        estimatedCompletionTime: 480,
        priority: 'high',
        status: 'pending_review',
      },
      {
        allocationPlanId: 'plan-002',
        planName: 'Plan B',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 3,
        plannedStartDate: '2024-01-01T08:00:00Z',
        plannedEndDate: '2024-01-01T17:00:00Z',
        expectedCompletionDate: '2024-01-01T20:00:00Z',
        currentProgressRate: 65,
        delayRiskScore: 55,
        feasibilityScore: 75,
        proposedWorkers: ['worker-003'],
        estimatedCompletionTime: 240,
        priority: 'medium',
        status: 'pending_review',
      },
    ]);

    mockGetRecentDelayRiskJudgment = jest.fn().mockImplementation((facilityId, teamId) => {
      const riskMap: { [key: string]: number } = {
        'facility-001:team-001': 75,
        'facility-002:team-002': 55,
      };
      return Promise.resolve({ riskScore: riskMap[`${facilityId}:${teamId}`] || 50 });
    });

    mockGetLatestProductivityData = jest.fn().mockResolvedValue([
      { workerId: 'worker-001', productivityRate: 88, skillLevel: 4, expertiseTypes: ['picking'] },
      { workerId: 'worker-002', productivityRate: 92, skillLevel: 5, expertiseTypes: ['packing'] },
      { workerId: 'worker-003', productivityRate: 85, skillLevel: 3, expertiseTypes: ['picking', 'sorting'] },
    ]);

    mockRecordOperationAudit = jest.fn().mockResolvedValue({ recorded: true });

    jest.doMock('../../src/logic/authorization', () => ({
      authorizeOperation: mockAuthorizeOperation,
    }));
    jest.doMock('../../src/logic/validation', () => ({
      validateDateTimeRange: mockValidateDateTimeRange,
    }));
    jest.doMock('../../src/logic/allocation-plan-repository', () => ({
      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
    }));
    jest.doMock('../../src/logic/risk-judgment-repository', () => ({
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgment,
    }));
    jest.doMock('../../src/logic/productivity-repository', () => ({
      getLatestProductivityDataByWorker: mockGetLatestProductivityData,
    }));
    jest.doMock('../../src/logic/audit-logger', () => ({
      recordOperationAudit: mockRecordOperationAudit,
    }));
  });

  it('should return allocation plans with priority scores, risk levels, and recommendation reasons', async () => {
    const userId = 'user-center-long-001';
    const targetFacilityIds = ['facility-001', 'facility-002'];
    const timeRangeStart = '2024-01-01T08:00:00Z';
    const timeRangeEnd = '2024-01-01T17:00:00Z';
    const priorityFilter = 'all';
    const maxResultCount = 50;

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      userId,
      expect.stringContaining('logistics_center_director')
    );

    expect(mockValidateDateTimeRange).toHaveBeenCalledWith(timeRangeStart, timeRangeEnd);

    expect(mockListAllocationPlansByCondition).toHaveBeenCalledWith(
      expect.objectContaining({
        targetFacilityIds,
        timeRangeStart,
        timeRangeEnd,
        priorityFilter,
      })
    );

    expect(mockGetRecentDelayRiskJudgment).toHaveBeenCalled();
    expect(mockGetLatestProductivityData).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('analysisCompletedAt');
    expect(result).toHaveProperty('dataFreshness');

    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // 仕様 step 9: 各フィールドが存在かつ値が付与されていることを検証
    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(plan.allocationPlanId.length).toBeGreaterThan(0);

      expect(plan).toHaveProperty('facilityId');
      expect(typeof plan.facilityId).toBe('string');

      expect(plan).toHaveProperty('teamId');
      expect(typeof plan.teamId).toBe('string');

      expect(plan).toHaveProperty('workInstructionId');
      expect(typeof plan.workInstructionId).toBe('string');

      expect(plan).toHaveProperty('allocatedWorkerCount');
      expect(typeof plan.allocatedWorkerCount).toBe('number');
      expect(plan.allocatedWorkerCount).toBeGreaterThan(0);

      expect(plan).toHaveProperty('plannedStartDate');
      expect(typeof plan.plannedStartDate).toBe('string');

      expect(plan).toHaveProperty('plannedEndDate');
      expect(typeof plan.plannedEndDate).toBe('string');

      expect(plan).toHaveProperty('expectedCompletionDate');
      expect(typeof plan.expectedCompletionDate).toBe('string');

      expect(plan).toHaveProperty('currentProgressRate');
      expect(typeof plan.currentProgressRate).toBe('number');
      expect(plan.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(plan.currentProgressRate).toBeLessThanOrEqual(100);

      expect(plan).toHaveProperty('delayRiskScore');
      expect(typeof plan.delayRiskScore).toBe('number');

      expect(plan).toHaveProperty('predictedDelayDays');
      expect(typeof plan.predictedDelayDays).toBe('number');

      expect(plan).toHaveProperty('feasibilityScore');
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);

      expect(plan).toHaveProperty('averageWorkerProductivityRate');
      expect(typeof plan.averageWorkerProductivityRate).toBe('number');
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);

      expect(plan).toHaveProperty('status');
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);

      // priorityScore（実装名: rankingPriority）が 0～100 の範囲内であることを検証
      expect(plan).toHaveProperty('rankingPriority');
      expect(typeof plan.rankingPriority).toBe('number');
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(0);
      expect(plan.rankingPriority).toBeLessThanOrEqual(100);

      // recommendationReason が空でない日本語テキストであることを検証
      expect(plan).toHaveProperty('recommendationReason');
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.recommendationReason.length).toBeGreaterThan(0);

      // riskLevel（実装名: delayRiskLevel）が存在することを検証
      expect(plan).toHaveProperty('delayRiskLevel');
      expect(['critical', 'high', 'medium', 'low']).toContain(plan.delayRiskLevel);
    });

    // 仕様 step 10: rankingPriority 降順チェック
    for (let i = 0; i < result.allocationPlans.length - 1; i++) {
      expect(result.allocationPlans[i].rankingPriority).toBeGreaterThanOrEqual(
        result.allocationPlans[i + 1].rankingPriority
      );
    }

    // 仕様 step 11: delayRiskLevel と rankingPriority の関係性チェック
    result.allocationPlans.forEach((plan) => {
      const priorityScore = plan.rankingPriority;
      if (priorityScore >= 75) {
        expect(plan.delayRiskLevel).toBe('low');
      } else if (priorityScore >= 50 && priorityScore < 75) {
        expect(plan.delayRiskLevel).toBe('medium');
      } else if (priorityScore < 50) {
        expect(['high', 'critical']).toContain(plan.delayRiskLevel);
      }
    });

    // 仕様 step 12: recommendationReason が複合的根拠を含むか検証
    result.allocationPlans.forEach((plan) => {
      const reason = plan.recommendationReason;
      expect(reason).toBeTruthy();
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(0);

      // スコア値が理由に含まれているか確認（計算結果を反映）
      const containsNumericValues = /\d+/.test(reason);
      expect(containsNumericValues).toBe(true);

      // 複合的根拠の検証：複数のカテゴリーからの情報が含まれている
      const hasDelayRiskContent =
        reason.includes('遅延') ||
        reason.includes('リスク') ||
        reason.includes('納期') ||
        reason.includes('リスクレベル');

      const hasSkillProductivityContent =
        reason.includes('スキル') ||
        reason.includes('生産性') ||
        reason.includes('適合') ||
        reason.includes('習熟度');

      const hasPriorityContent =
        reason.includes('優先度') ||
        reason.includes('配置') ||
        reason.includes('推奨');

      // 複合的根拠：複数のカテゴリーからキーワードが含まれていることを検証
      const categoriesPresent = [hasDelayRiskContent, hasSkillProductivityContent, hasPriorityContent].filter(
        (c) => c
      ).length;
      expect(categoriesPresent).toBeGreaterThanOrEqual(2);
    });

    // 仕様 step 13: totalCount が指定フィルタ条件に合致する配置案の総件数と一致することを検証
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationPlans.length);

    // 仕様 step 14: analysisCompletedAt が ISO 8601形式の日時文字列であることを検証
    expect(typeof result.analysisCompletedAt).toBe('string');
    const analysisTime = new Date(result.analysisCompletedAt);
    expect(analysisTime instanceof Date).toBe(true);
    expect(analysisTime.toString() !== 'Invalid Date').toBe(true);
    expect(result.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?/);
    const now = new Date();
    expect(analysisTime.getTime()).toBeLessThanOrEqual(now.getTime());

    // 仕様 step 15: dataFreshness オブジェクトが正しい構造を持つことを検証
    expect(result.dataFreshness).toHaveProperty('progressDataAge');
    expect(result.dataFreshness).toHaveProperty('productivityDataAge');
    expect(result.dataFreshness).toHaveProperty('riskJudgmentAge');

    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');

    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);

    expect(Number.isInteger(result.dataFreshness.progressDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.productivityDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.riskJudgmentAge)).toBe(true);
  });
});