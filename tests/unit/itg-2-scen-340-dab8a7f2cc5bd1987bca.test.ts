import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as initialAssignmentModule from '../../src/logic/initial-assignment-performance-analysis';

describe('SCEN-340: 初期割当実績が過去平均の80%以上かつエラー率が5%を超えるとき習熟度段階がDEVELOPINGと判定される', () => {
  const workerId = 'worker-001';
  const initialAssignmentId = 'assignment-001';
  const requestingUserId = 'leader-001';
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return DEVELOPING stage when performance is 80% of historical average and error rate exceeds 5%', async () => {
    const historicalAvgProductivity = 100;
    const historicalAvgQuality = 90;
    const currentProductivity = 85; // 85% of historical average
    const currentQualityScore = 85; // quality score with 5.1% error rate
    const errorRate = 5.5; // exceeds 5%

    const mockPerformanceRecords = [
      {
        id: 'perf-001',
        workerId,
        actualQuantity: 85,
        workTimeMinutes: 480,
        qualityScore: currentQualityScore,
        workTypeId: 'wt-001',
        workTypeName: 'Assembly',
        errorCount: 6,
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        id: 'perf-002',
        workerId,
        actualQuantity: 85,
        workTimeMinutes: 480,
        qualityScore: currentQualityScore,
        workTypeId: 'wt-002',
        workTypeName: 'Testing',
        errorCount: 6,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        id: 'perf-003',
        workerId,
        actualQuantity: 70,
        workTimeMinutes: 480,
        qualityScore: currentQualityScore,
        workTypeId: 'wt-003',
        workTypeName: 'Packaging',
        errorCount: 5,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ];

    const mockHistoricalProductivity = [
      {
        id: 'hist-001',
        workerId: 'other-worker-001',
        completedQuantity: 100,
        workTimeMinutes: 480,
        productivityRate: 100,
        qualityScore: historicalAvgQuality,
        errorCount: 2,
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      },
      {
        id: 'hist-002',
        workerId: 'other-worker-001',
        completedQuantity: 100,
        workTimeMinutes: 480,
        productivityRate: 100,
        qualityScore: historicalAvgQuality,
        errorCount: 2,
        createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      },
    ];

    const mockWorker = {
      id: workerId,
      name: 'New Worker',
      status: 'active',
    };

    const mockInitialAssignment = {
      id: initialAssignmentId,
      workerId,
      department: 'Manufacturing',
      process: 'Assembly',
      assignmentStatus: 'active',
    };

    // Mock functions directly
    jest.spyOn(initialAssignmentModule, 'validateInputData' as any).mockResolvedValue(true);
    
    jest.spyOn(initialAssignmentModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    
    jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(mockInitialAssignment);
    
    jest.spyOn(initialAssignmentModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue(mockPerformanceRecords);
    
    jest.spyOn(initialAssignmentModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue(mockHistoricalProductivity);
    
    jest.spyOn(initialAssignmentModule, 'findWorkTypeById' as any).mockImplementation((id: string) => {
      const workTypes: { [key: string]: any } = {
        'wt-001': { id: 'wt-001', name: 'Assembly', standardProductivity: 100, standardQualityScore: 90 },
        'wt-002': { id: 'wt-002', name: 'Testing', standardProductivity: 100, standardQualityScore: 90 },
        'wt-003': { id: 'wt-003', name: 'Packaging', standardProductivity: 100, standardQualityScore: 90 },
      };
      return Promise.resolve(workTypes[id]);
    });

    const sendInitialAssignmentPerformanceAnalysisToLeaderSpy = jest.spyOn(
      initialAssignmentModule,
      'sendInitialAssignmentPerformanceAnalysisToLeader' as any
    ).mockResolvedValue(undefined);

    const result = await analyzeInitialAssignmentPerformance({
      workerId,
      initialAssignmentId,
      analysisStartDateTime: twentyFourHoursAgo,
      analysisEndDateTime: now,
      requestingUserId,
    });

    expect(result.proficiencyStage.stage).toBe('DEVELOPING');

    expect(result.proficiencyStage.evaluationReason).toMatch(
      /80%.*エラー率.*5%|エラー率.*5%.*80%|DEVELOPING/
    );

    expect(result.aggregatedPerformanceData.totalCompletedQuantity).toBeGreaterThan(0);
    expect(result.aggregatedPerformanceData.totalWorkTimeMinutes).toBeGreaterThan(0);
    expect(result.aggregatedPerformanceData.averageProductivityRate).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedPerformanceData.averageQualityScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.aggregatedPerformanceData.workTypeBreakdown)).toBe(true);
    expect(result.aggregatedPerformanceData.workTypeBreakdown.length).toBeGreaterThanOrEqual(3);

    const deviationPercentage = result.comparisonWithStandardPerformance.deviationPercentage;
    expect(deviationPercentage).toBeGreaterThanOrEqual(80);
    expect(deviationPercentage).toBeLessThanOrEqual(100);

    const highErrorRateRisk = result.riskFlags?.find((r) => r.riskType === 'HIGH_ERROR_RATE');
    expect(highErrorRateRisk).toBeDefined();
    if (highErrorRateRisk) {
      expect(['MEDIUM', 'HIGH']).toContain(highErrorRateRisk.severity);
      expect(highErrorRateRisk.description).toMatch(/5%|エラー率/);
    }

    expect(['MAINTAIN_CURRENT', 'INCREASE_DIFFICULTY']).toContain(
      result.difficultyAdjustmentRecommendation.recommendedAction
    );

    expect(sendInitialAssignmentPerformanceAnalysisToLeaderSpy).toHaveBeenCalled();
    const callArgs = sendInitialAssignmentPerformanceAnalysisToLeaderSpy.mock.calls[0];
    expect(callArgs[0]).toBe(requestingUserId);
    expect(callArgs[1]).toBeDefined();

    expect(result.nextReviewSchedule).toBeInstanceOf(Date);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    const reviewTimeDiff = result.nextReviewSchedule.getTime() - result.analysisTimestamp.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const threeDaysMs = 72 * 60 * 60 * 1000;
    expect(reviewTimeDiff).toBeGreaterThanOrEqual(oneDayMs);
    expect(reviewTimeDiff).toBeLessThanOrEqual(threeDaysMs);

    expect(result.analysisPeriod.startDateTime).toEqual(twentyFourHoursAgo);
    expect(result.analysisPeriod.endDateTime).toEqual(now);
    expect(result.workerId).toBe(workerId);
    expect(result.initialAssignmentId).toBe(initialAssignmentId);
  });
});