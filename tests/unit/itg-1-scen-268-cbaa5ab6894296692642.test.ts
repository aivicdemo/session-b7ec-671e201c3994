import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-268: extractAndRankAllocationPlansForReview', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockListAllocationPlansByCondition: jest.Mock;
  let mockGetRecentDelayRiskJudgment: jest.Mock;
  let mockGetLatestProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockValidateDateTimeRange = jest.fn().mockResolvedValue({ valid: true });
    mockListAllocationPlansByCondition = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'alloc-001',
        planName: 'Plan A',
        facilityId: 'facility-A',
        teamId: 'team-A',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T12:00:00Z',
        expectedCompletionDate: '2024-01-15T11:00:00Z',
        currentProgressRate: 60,
        delayRiskLevel: 'high',
        delayRiskScore: 75,
        predictedDelayDays: 1,
        feasibilityScore: 80,
        averageWorkerProductivityRate: 85,
        recommendationReason: 'High priority due to delay risk',
        rankingPriority: 85,
        status: 'pending_review',
      },
      {
        allocationPlanId: 'alloc-002',
        planName: 'Plan B',
        facilityId: 'facility-B',
        teamId: 'team-B',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 3,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T12:00:00Z',
        expectedCompletionDate: '2024-01-15T12:30:00Z',
        currentProgressRate: 70,
        delayRiskLevel: 'medium',
        delayRiskScore: 45,
        predictedDelayDays: 0,
        feasibilityScore: 75,
        averageWorkerProductivityRate: 75,
        recommendationReason: 'Medium priority',
        rankingPriority: 65,
        status: 'pending_review',
      },
      {
        allocationPlanId: 'alloc-003',
        planName: 'Plan C',
        facilityId: 'facility-A',
        teamId: 'team-A',
        workInstructionId: 'work-003',
        allocatedWorkerCount: 4,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T12:00:00Z',
        expectedCompletionDate: '2024-01-15T11:30:00Z',
        currentProgressRate: 65,
        delayRiskLevel: 'medium',
        delayRiskScore: 55,
        predictedDelayDays: 0.5,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 90,
        recommendationReason: 'Balanced plan',
        rankingPriority: 75,
        status: 'pending_review',
      },
    ]);
    mockGetRecentDelayRiskJudgment = jest.fn().mockResolvedValue([
      {
        facilityId: 'facility-A',
        teamId: 'team-A',
        riskScore: 65,
        remainingHours: 2.5,
        plannedProgressRate: 80,
      },
      {
        facilityId: 'facility-B',
        teamId: 'team-B',
        riskScore: 45,
        remainingHours: 3.5,
        plannedProgressRate: 85,
      },
    ]);
    mockGetLatestProductivityData = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-1',
        productivityRate: 85,
        skillLevel: 4,
      },
      {
        workerId: 'worker-2',
        productivityRate: 75,
        skillLevel: 3,
      },
      {
        workerId: 'worker-3',
        productivityRate: 90,
        skillLevel: 5,
      },
    ]);
    mockRecordOperationAudit = jest.fn().mockResolvedValue({ recorded: true });

    jest.doMock('../../src/services/authorization-service', () => ({\n      authorizeOperation: mockAuthorizeOperation,
    }));
    jest.doMock('../../src/services/validation-service', () => ({\n      validateDateTimeRange: mockValidateDateTimeRange,
    }));
    jest.doMock('../../src/repository/allocation-plan-repository', () => ({\n      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
    }));
    jest.doMock('../../src/repository/delay-risk-repository', () => ({\n      getRecentDelayRiskJudgmentByFacilityAndTeam:
        mockGetRecentDelayRiskJudgment,
    }));
    jest.doMock('../../src/repository/productivity-repository', () => ({\n      getLatestProductivityDataByWorker: mockGetLatestProductivityData,
    }));
    jest.doMock('../../src/services/audit-service', () => ({\n      recordOperationAudit: mockRecordOperationAudit,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('指定されたフィルタ条件に基づいて優先度付けされた配置案が返される', async () => {
    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toHaveLength(3);

    result.allocationPlans.forEach((plan) => {
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

      expect(typeof plan.rankingPriority).toBe('number');
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(0);
      expect(plan.rankingPriority).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low', 'critical']).toContain(
        plan.delayRiskLevel
      );
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
      expect(typeof plan.planName).toBe('string');
      expect(plan.planName.length).toBeGreaterThan(0);
    });

    const priorities = result.allocationPlans.map((p) => p.rankingPriority);
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i]).toBeLessThanOrEqual(priorities[i - 1]);
    }

    expect(result.totalCount).toBe(3);
    expect(result.analysisCompletedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });

  test('優先度スコア計算が業務ルール br-tx_2-004 に基づいて実行される', async () => {
    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    result.allocationPlans.forEach((plan) => {
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(0);
      expect(plan.rankingPriority).toBeLessThanOrEqual(100);

      expect(typeof plan.delayRiskScore).toBe('number');
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);

      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);

      expect(typeof plan.averageWorkerProductivityRate).toBe('number');
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);

      expect(typeof plan.currentProgressRate).toBe('number');
      expect(plan.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(plan.currentProgressRate).toBeLessThanOrEqual(100);
    });

    const deliveryRiskWeight = 0.35;
    const skillMatchWeight = 0.25;
    const productivityWeight = 0.25;
    const workloadBalanceWeight = 0.15;

    result.allocationPlans.forEach((plan) => {
      const normalizedDelayRiskScore = 100 - plan.delayRiskScore;
      const skillMatchScore = plan.feasibilityScore;
      const progressPriorityScore = plan.currentProgressRate;
      const workloadBalanceScore = plan.feasibilityScore;

      const calculatedScore =
        normalizedDelayRiskScore * deliveryRiskWeight +
        skillMatchScore * skillMatchWeight +
        progressPriorityScore * productivityWeight +
        workloadBalanceScore * workloadBalanceWeight;

      expect(plan.rankingPriority).toBeCloseTo(calculatedScore, 1);
    });
  });

  test('配置案が優先度スコアの降順でソートされている', async () => {
    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    const priorities = result.allocationPlans.map((p) => p.rankingPriority);
    for (let i = 0; i < priorities.length - 1; i++) {
      expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i + 1]);
    }
  });

  test('各配置案に riskLevel と recommendationReason が付与されている', async () => {
    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('delayRiskLevel');
      expect(['high', 'medium', 'low', 'critical']).toContain(
        plan.delayRiskLevel
      );

      expect(plan).toHaveProperty('recommendationReason');
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
    });
  });

  test('ユーザー権限がない場合、エラーが発生する', async () => {
    mockAuthorizeOperation.mockResolvedValueOnce({ authorized: false });

    const input = {
      userId: 'user-unauthorized',
      targetFacilityIds: ['facility-A'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow();
  });

  test('時間帯が不正な場合（開始時刻 > 終了時刻）、エラーが発生する', async () => {
    mockValidateDateTimeRange.mockResolvedValueOnce({ valid: false });

    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A'],
      timeRangeStart: '2024-01-15T12:00:00Z',
      timeRangeEnd: '2024-01-15T09:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow();
  });

  test('フィルタ条件に合致する配置案が存在しない場合、空配列が返される', async () => {
    mockListAllocationPlansByCondition.mockResolvedValueOnce([]);

    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-C'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  test('dataFreshness が秒単位の非負数で返される', async () => {
    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });

  test('操作監査ログが記録される', async () => {
    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    await extractAndRankAllocationPlansForReview(input);

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  test('analysisCompletedAt が ISO 8601 形式の日時文字列である', async () => {
    const input = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.analysisCompletedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});