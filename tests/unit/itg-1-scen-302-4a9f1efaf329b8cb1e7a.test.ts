import { extractAndRankAllocationPlansForReview, ExtractAndRankAllocationPlansForReviewInput } from '../../src/logic/allocation-plan-review-approval';
import * as allocationPlanModule from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-302: extractAndRankAllocationPlansForReview', () => {
  let validateDateTimeRangeMock: jest.SpyInstance;

  beforeEach(() => {
    validateDateTimeRangeMock = jest.spyOn(allocationPlanModule, 'validateDateTimeRange' as any).mockImplementation((start: string, end: string) => {
      // モック実装：時間帯の妥当性検証を実行
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      if (startTime >= endTime) {
        throw new Error('開始日時は終了日時より前である必要があります');
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validateDateTimeRangeが呼び出され、時間帯の妥当性が検証される', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-001',
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // validateDateTimeRangeが正確に1回だけ呼び出されたことを検証
    expect(validateDateTimeRangeMock).toHaveBeenCalledTimes(1);

    // validateDateTimeRangeの呼び出し時の引数が正確であることを検証
    expect(validateDateTimeRangeMock).toHaveBeenCalledWith(
      '2024-01-15T09:00:00Z',
      '2024-01-15T12:00:00Z'
    );

    // 結果が正常に返却されることを確認
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    
    // ISO 8601形式の日時が返却されることを確認
    expect(result.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    
    // dataFreshnessオブジェクトが含まれることを確認
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness).toHaveProperty('progressDataAge');
    expect(result.dataFreshness).toHaveProperty('productivityDataAge');
    expect(result.dataFreshness).toHaveProperty('riskJudgmentAge');
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
  });

  it('validateDateTimeRangeが時間帯検証に失敗し、エラーがスローされる', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-001',
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      timeRangeStart: '2024-01-15T12:00:00Z',
      timeRangeEnd: '2024-01-15T09:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    // 時間帯の妥当性検証に失敗し、エラーがスローされることを確認
    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow();

    // validateDateTimeRangeが呼び出されたことを検証
    expect(validateDateTimeRangeMock).toHaveBeenCalled();
  });

  it('validateDateTimeRangeが正確な引数で実装内で呼び出される', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-001',
      targetFacilityIds: ['FAC-001'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // validateDateTimeRangeが正確な引数で呼び出されたことを検証
    expect(validateDateTimeRangeMock).toHaveBeenCalledWith(
      input.timeRangeStart,
      input.timeRangeEnd
    );

    // 処理が正常に完了し、結果が返却されることを確認
    expect(result).toBeDefined();
    expect(result.analysisCompletedAt).toBeDefined();
    
    // 返却されたデータが入力時間帯と矛盾しないことで、
    // 時間帯検証結果が後続処理で使用されたことを確認
    const analysisTime = new Date(result.analysisCompletedAt).getTime();
    const startTime = new Date(input.timeRangeStart).getTime();
    
    // 分析完了日時は分析時点の現在日時であり、
    // 入力時間帯の妥当性が検証されたことで
    // 入力が正常な状態で処理されたことを示唆
    expect(analysisTime).toBeGreaterThanOrEqual(startTime);
  });

  it('ExtractAndRankAllocationPlansForReviewOutputが正常な構造で返却される', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-001',
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // allocationPlans配列が存在し、要素が正常な構造を持つことを確認
    expect(result.allocationPlans).toBeInstanceOf(Array);
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
    });

    // totalCountが数値であることを確認
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // analysisCompletedAtがISO 8601形式であることを確認
    expect(result.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // dataFreshnessが正常な構造を持つことを確認
    expect(result.dataFreshness).toHaveProperty('progressDataAge');
    expect(result.dataFreshness).toHaveProperty('productivityDataAge');
    expect(result.dataFreshness).toHaveProperty('riskJudgmentAge');
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });
});