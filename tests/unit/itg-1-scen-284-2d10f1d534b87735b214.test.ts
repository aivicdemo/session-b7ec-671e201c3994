import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-284: dataFreshness の各データ年齢が秒単位で正確に計算されている', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockListAllocationPlansByCondition: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockValidateDateTimeRange = jest.fn().mockResolvedValue(true);
    mockListAllocationPlansByCondition = jest.fn();
    mockGetLatestProductivityDataByWorker = jest.fn();
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = jest.fn();
    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('データ年齢が秒単位で正確に計算されていること', async () => {
    const now = Date.now();
    jest.setSystemTime(new Date(now));

    const progressDataTime = now - 60000;
    const productivityDataTime = now - 90000;
    const riskJudgmentTime = now - 150000;

    mockListAllocationPlansByCondition.mockResolvedValue([
      {
        candidateId: 'cand-001',
        facilityId: 'facility-A',
        estimatedCompletionTime: 120,
      },
      {
        candidateId: 'cand-002',
        facilityId: 'facility-B',
        estimatedCompletionTime: 90,
      },
      {
        candidateId: 'cand-003',
        facilityId: 'facility-A',
        estimatedCompletionTime: 150,
      },
    ]);

    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      timestamp: new Date(productivityDataTime).toISOString(),
      data: [
        { workerId: 'worker-001', productivityRate: 80 },
      ],
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      timestamp: new Date(riskJudgmentTime).toISOString(),
      judgments: [
        { facilityId: 'facility-A', riskLevel: 'low', delayDays: 0 },
        { facilityId: 'facility-B', riskLevel: 'medium', delayDays: 1 },
      ],
    });

    const input = {
      userId: 'center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T12:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input, {
      authorizeOperation: mockAuthorizeOperation,
      validateDateTimeRange: mockValidateDateTimeRange,
      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result.dataFreshness.progressDataAge).toBe(60);
    expect(result.dataFreshness.productivityDataAge).toBe(90);
    expect(result.dataFreshness.riskJudgmentAge).toBe(150);
  });

  it('各データ年齢が整数の秒単位で表現されていること', async () => {
    const now = Date.now();
    jest.setSystemTime(new Date(now));

    mockListAllocationPlansByCondition.mockResolvedValue([
      {
        candidateId: 'cand-001',
        facilityId: 'facility-A',
        estimatedCompletionTime: 120,
      },
    ]);

    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      timestamp: new Date(now - 90000).toISOString(),
      data: [],
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      timestamp: new Date(now - 150000).toISOString(),
      judgments: [],
    });

    const input = {
      userId: 'center-001',
      targetFacilityIds: ['facility-A'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T12:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input, {
      authorizeOperation: mockAuthorizeOperation,
      validateDateTimeRange: mockValidateDateTimeRange,
      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(Number.isInteger(result.dataFreshness.progressDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.productivityDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.riskJudgmentAge)).toBe(true);
  });

  it('時間経過に応じてデータ年齢が正確に更新されること', async () => {
    const initialTime = Date.now();
    jest.setSystemTime(new Date(initialTime));

    mockListAllocationPlansByCondition.mockResolvedValue([
      {
        candidateId: 'cand-001',
        facilityId: 'facility-A',
        estimatedCompletionTime: 120,
      },
    ]);

    const productivityTime = initialTime - 90000;
    const riskTime = initialTime - 150000;

    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      timestamp: new Date(productivityTime).toISOString(),
      data: [],
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      timestamp: new Date(riskTime).toISOString(),
      judgments: [],
    });

    const input = {
      userId: 'center-001',
      targetFacilityIds: ['facility-A'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T12:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result1 = await extractAndRankAllocationPlansForReview(input, {
      authorizeOperation: mockAuthorizeOperation,
      validateDateTimeRange: mockValidateDateTimeRange,
      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
      recordOperationAudit: mockRecordOperationAudit,
    });

    jest.advanceTimersByTime(30000);

    const result2 = await extractAndRankAllocationPlansForReview(input, {
      authorizeOperation: mockAuthorizeOperation,
      validateDateTimeRange: mockValidateDateTimeRange,
      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result2.dataFreshness.progressDataAge).toBeGreaterThan(result1.dataFreshness.progressDataAge);
    expect(result2.dataFreshness.productivityDataAge).toBeGreaterThan(result1.dataFreshness.productivityDataAge);
    expect(result2.dataFreshness.riskJudgmentAge).toBeGreaterThan(result1.dataFreshness.riskJudgmentAge);
    expect(result2.dataFreshness.progressDataAge - result1.dataFreshness.progressDataAge).toBe(30);
  });

  it('複数拠点・複数チームの配置案が正確に抽出・優先度付けされること', async () => {
    const now = Date.now();
    jest.setSystemTime(new Date(now));

    mockListAllocationPlansByCondition.mockResolvedValue([
      {
        candidateId: 'cand-001',
        facilityId: 'facility-A',
        estimatedCompletionTime: 120,
      },
      {
        candidateId: 'cand-002',
        facilityId: 'facility-B',
        estimatedCompletionTime: 90,
      },
      {
        candidateId: 'cand-003',
        facilityId: 'facility-A',
        estimatedCompletionTime: 150,
      },
    ]);

    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      timestamp: new Date(now - 90000).toISOString(),
      data: [],
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      timestamp: new Date(now - 150000).toISOString(),
      judgments: [],
    });

    const input = {
      userId: 'center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T12:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input, {
      authorizeOperation: mockAuthorizeOperation,
      validateDateTimeRange: mockValidateDateTimeRange,
      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result.allocationPlans).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.allocationPlans.every(p => typeof p.rankingPriority === 'number')).toBe(true);
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('center-001');
    expect(mockValidateDateTimeRange).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('スタブ処理の権限・バリデーション・監査ログが呼び出されること', async () => {
    const now = Date.now();
    jest.setSystemTime(new Date(now));

    mockListAllocationPlansByCondition.mockResolvedValue([
      {
        candidateId: 'cand-001',
        facilityId: 'facility-A',
        estimatedCompletionTime: 120,
      },
    ]);

    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      timestamp: new Date(now - 90000).toISOString(),
      data: [],
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      timestamp: new Date(now - 150000).toISOString(),
      judgments: [],
    });

    const input = {
      userId: 'center-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T12:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    await extractAndRankAllocationPlansForReview(input, {
      authorizeOperation: mockAuthorizeOperation,
      validateDateTimeRange: mockValidateDateTimeRange,
      listAllocationPlansByCondition: mockListAllocationPlansByCondition,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('center-001');
    expect(mockValidateDateTimeRange).toHaveBeenCalledWith(
      input.timeRangeStart,
      input.timeRangeEnd
    );
    expect(mockListAllocationPlansByCondition).toHaveBeenCalled();
    expect(mockGetLatestProductivityDataByWorker).toHaveBeenCalled();
    expect(mockGetRecentDelayRiskJudgmentByFacilityAndTeam).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });
});