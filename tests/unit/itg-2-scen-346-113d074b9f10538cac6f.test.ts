import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';

describe('SCEN-346: 新配属者の初期割当作業完了後の分析結果通知', () => {
  let mockFindWorkerById: jest.Mock;
  let mockFindInitialAssignmentByWorker: jest.Mock;
  let mockFindPerformanceRecordsByWorkerAndPeriod: jest.Mock;
  let mockFindProductivityDataByWorkerAndPeriod: jest.Mock;
  let mockFindWorkTypeById: jest.Mock;
  let mockValidateInputData: jest.Mock;
  let mockSendInitialAssignmentPerformanceAnalysisToLeader: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFindWorkerById = jest.fn();
    mockFindInitialAssignmentByWorker = jest.fn();
    mockFindPerformanceRecordsByWorkerAndPeriod = jest.fn();
    mockFindProductivityDataByWorkerAndPeriod = jest.fn();
    mockFindWorkTypeById = jest.fn();
    mockValidateInputData = jest.fn();
    mockSendInitialAssignmentPerformanceAnalysisToLeader = jest.fn();

    mockValidateInputData.mockReturnValue(true);
    mockFindWorkerById.mockReturnValue({ id: 'W001', name: 'Worker 1' });
    mockFindInitialAssignmentByWorker.mockReturnValue({
      id: 'IA001',
      workerId: 'W001',
      startDate: new Date(),
      status: 'active'
    });
    mockFindPerformanceRecordsByWorkerAndPeriod.mockReturnValue([
      { id: 'PR001', workTypeId: 'WT001', completedQuantity: 10, workTime: 60 },
      { id: 'PR002', workTypeId: 'WT002', completedQuantity: 10, workTime: 60 },
      { id: 'PR003', workTypeId: 'WT003', completedQuantity: 10, workTime: 60 }
    ]);
    mockFindProductivityDataByWorkerAndPeriod.mockReturnValue([
      { id: 'PD001', productivityRate: 85, qualityScore: 90 }
    ]);
    mockFindWorkTypeById.mockImplementation((id: string) => ({
      id,
      name: `Work Type ${id}`,
      difficultyLevel: 2
    }));
    mockSendInitialAssignmentPerformanceAnalysisToLeader.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('analyzeInitialAssignmentPerformanceは分析結果を返し、現場リーダーに通知する', async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const input = {
      workerId: 'W001',
      initialAssignmentId: 'IA001',
      analysisStartDateTime: twentyFourHoursAgo,
      analysisEndDateTime: now,
      requestingUserId: 'L001'
    };

    const result = await analyzeInitialAssignmentPerformance(input, {
      findWorkerById: mockFindWorkerById,
      findInitialAssignmentByWorker: mockFindInitialAssignmentByWorker,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecordsByWorkerAndPeriod,
      findProductivityDataByWorkerAndPeriod: mockFindProductivityDataByWorkerAndPeriod,
      findWorkTypeById: mockFindWorkTypeById,
      validateInputData: mockValidateInputData,
      sendInitialAssignmentPerformanceAnalysisToLeader: mockSendInitialAssignmentPerformanceAnalysisToLeader
    });

    expect(result.workerId).toBe('W001');
    expect(result.initialAssignmentId).toBe('IA001');
    expect(result.analysisPeriod.startDateTime).toEqual(twentyFourHoursAgo);
    expect(result.analysisPeriod.endDateTime).toEqual(now);

    expect(result.aggregatedPerformanceData).toBeDefined();
    expect(result.aggregatedPerformanceData.totalCompletedQuantity).toBeGreaterThan(0);
    expect(result.aggregatedPerformanceData.totalWorkTimeMinutes).toBeGreaterThan(0);
    expect(result.aggregatedPerformanceData.averageProductivityRate).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedPerformanceData.averageQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedPerformanceData.workTypeBreakdown.length).toBeGreaterThanOrEqual(3);

    const uniqueWorkTypeIds = new Set(
      result.aggregatedPerformanceData.workTypeBreakdown.map(wt => wt.workTypeId)
    );
    expect(uniqueWorkTypeIds.size).toBeGreaterThanOrEqual(3);

    result.aggregatedPerformanceData.workTypeBreakdown.forEach((wt: any) => {
      expect(wt.workTypeId).toBeDefined();
      expect(wt.workTypeName).toBeDefined();
      expect(wt.completedQuantity).toBeGreaterThanOrEqual(0);
      expect(wt.workTimeMinutes).toBeGreaterThanOrEqual(0);
      expect(wt.productivityRate).toBeGreaterThanOrEqual(0);
      expect(wt.qualityScore).toBeGreaterThanOrEqual(0);
    });

    expect(result.proficiencyStage).toBeDefined();
    expect(['BEGINNER', 'DEVELOPING', 'COMPETENT', 'PROFICIENT']).toContain(
      result.proficiencyStage.stage
    );
    expect(result.proficiencyStage.stageDescription).toBeDefined();
    expect(typeof result.proficiencyStage.stageDescription).toBe('string');
    expect(result.proficiencyStage.evaluationReason).toBeDefined();
    expect(typeof result.proficiencyStage.evaluationReason).toBe('string');
    expect(result.proficiencyStage.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.proficiencyStage.confidenceScore).toBeLessThanOrEqual(100);

    expect(result.difficultyAdjustmentRecommendation).toBeDefined();
    expect(['MAINTAIN_CURRENT', 'INCREASE_DIFFICULTY', 'DECREASE_DIFFICULTY', 'CHANGE_WORK_TYPE']).toContain(
      result.difficultyAdjustmentRecommendation.recommendedAction
    );
    expect(result.difficultyAdjustmentRecommendation.targetWorkTypes).toBeDefined();
    expect(Array.isArray(result.difficultyAdjustmentRecommendation.targetWorkTypes)).toBe(true);
    result.difficultyAdjustmentRecommendation.targetWorkTypes.forEach((twt: any) => {
      expect(twt.workTypeId).toBeDefined();
      expect(twt.workTypeName).toBeDefined();
      expect(typeof twt.currentDifficultyLevel).toBe('number');
      expect(typeof twt.recommendedDifficultyLevel).toBe('number');
      expect(twt.rationale).toBeDefined();
    });
    expect(result.difficultyAdjustmentRecommendation.implementationTiming).toBeDefined();
    expect(typeof result.difficultyAdjustmentRecommendation.implementationTiming).toBe('string');

    expect(result.comparisonWithStandardPerformance).toBeDefined();
    expect(typeof result.comparisonWithStandardPerformance.standardProductivityRate).toBe('number');
    expect(result.comparisonWithStandardPerformance.standardProductivityRate).toBeGreaterThanOrEqual(0);
    expect(typeof result.comparisonWithStandardPerformance.actualProductivityRate).toBe('number');
    expect(result.comparisonWithStandardPerformance.actualProductivityRate).toBeGreaterThanOrEqual(0);
    expect(typeof result.comparisonWithStandardPerformance.deviationPercentage).toBe('number');
    expect(typeof result.comparisonWithStandardPerformance.standardQualityScore).toBe('number');
    expect(result.comparisonWithStandardPerformance.standardQualityScore).toBeGreaterThanOrEqual(0);
    expect(typeof result.comparisonWithStandardPerformance.actualQualityScore).toBe('number');
    expect(result.comparisonWithStandardPerformance.actualQualityScore).toBeGreaterThanOrEqual(0);
    expect(typeof result.comparisonWithStandardPerformance.qualityDeviation).toBe('number');

    expect(result.nextReviewSchedule).toBeInstanceOf(Date);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    expect(mockSendInitialAssignmentPerformanceAnalysisToLeader).toHaveBeenCalled();
    expect(mockSendInitialAssignmentPerformanceAnalysisToLeader).toHaveBeenCalledWith(
      'L001',
      expect.objectContaining({
        workerId: 'W001',
        initialAssignmentId: 'IA001',
        aggregatedPerformanceData: expect.any(Object),
        proficiencyStage: expect.any(Object),
        difficultyAdjustmentRecommendation: expect.any(Object),
        comparisonWithStandardPerformance: expect.any(Object)
      })
    );
  });
});