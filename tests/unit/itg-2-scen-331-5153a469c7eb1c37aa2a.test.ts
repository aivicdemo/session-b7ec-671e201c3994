import { jest } from '@jest/globals';
import * as onboardingAnalysisModule from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-331: 分析結果の analysisTimestamp が現在日時の ISO 8601 形式で記録される', () => {
  let validateInputDataSpy: jest.SpyInstance;
  let extractPeerWorkerGroupSpy: jest.SpyInstance;
  let aggregateHistoricalPerformanceDataSpy: jest.SpyInstance;
  let identifyStrengthWorkTypesSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    validateInputDataSpy = jest.spyOn(onboardingAnalysisModule, 'validateInputData' as any).mockReturnValue({
      isValid: true,
      errors: [],
    });

    extractPeerWorkerGroupSpy = jest.spyOn(onboardingAnalysisModule, 'extractPeerWorkerGroup' as any).mockResolvedValue({
      peerWorkerIds: ['WORKER-001', 'WORKER-002', 'WORKER-003', 'WORKER-004', 'WORKER-005'],
      peerWorkerCount: 5,
      jobClassification: 'ピッキング作業',
      assignmentSiteId: 'SITE-001',
    });

    aggregateHistoricalPerformanceDataSpy = jest
      .spyOn(onboardingAnalysisModule, 'aggregateHistoricalPerformanceDataForPeerGroup' as any)
      .mockResolvedValue({
        peerWorkerCount: 5,
        analysisDataPeriodDays: 30,
        performanceByWorkType: [
          {
            workTypeId: 'WT-001',
            workTypeName: 'ピッキング',
            recordCount: 50,
            averageProductivityRate: 90,
            averageQualityScore: 92,
            averageErrorCount: 0.5,
            minProductivityRate: 85,
            maxProductivityRate: 95,
          },
        ],
        overallStatistics: {
          totalRecordCount: 150,
          averageProductivityRate: 88,
          averageQualityScore: 90,
          averageErrorCount: 0.6,
          dataCompleteness: 0.95,
        },
        aggregationStatus: 'success',
        aggregationTimestamp: new Date().toISOString(),
      });

    identifyStrengthWorkTypesSpy = jest
      .spyOn(onboardingAnalysisModule, 'identifyStrengthWorkTypesAndProductivityPatterns' as any)
      .mockResolvedValue({
        strengthWorkTypes: [
          {
            workTypeId: 'WT-001',
            workTypeName: 'ピッキング',
            averageProductivityRate: 90,
            averageQualityScore: 92,
            workerCountExcellingInThisType: 4,
            productivityVariance: 2.5,
          },
        ],
        productivityPatterns: [
          {
            patternName: '安定型',
            description: '一定レベルの生産性を継続的に発揮',
            averageProductivityRate: 88,
            averageQualityScore: 90,
            typicalWorkTypes: ['WT-001'],
            applicableWorkerCount: 3,
            patternCharacteristics: {
              consistencyScore: 95,
              qualityStability: 92,
            },
          },
        ],
        recommendedInitialWorkTypes: [
          {
            workTypeId: 'WT-001',
            workTypeName: 'ピッキング',
            recommendationReason: 'ピアグループの得意業務で習熟が早い',
            estimatedLearningCurve: '短期（1-2週間）',
            riskLevel: 'low',
          },
        ],
        analysisConfidenceScore: 92,
        analysisTimestamp: new Date().toISOString(),
        analysisStatus: 'success',
      });
  });

  afterEach(() => {
    validateInputDataSpy.mockRestore();
    extractPeerWorkerGroupSpy.mockRestore();
    aggregateHistoricalPerformanceDataSpy.mockRestore();
    identifyStrengthWorkTypesSpy.mockRestore();
  });

  it('analyzeOnboardingContextAndExtractPeerPerformancePatterns が analysisTimestamp を現在日時の ISO 8601 形式で記録する', async () => {
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15T09:00:00Z',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    const beforeCallTime = new Date();
    const result = await onboardingAnalysisModule.analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);
    const afterCallTime = new Date();

    expect(result).toBeDefined();
    expect(result.analysisTimestamp).toBeDefined();

    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(result.analysisTimestamp).toMatch(timestampRegex);

    const analysisTime = new Date(result.analysisTimestamp);
    const beforeCallMs = beforeCallTime.getTime();
    const afterCallMs = afterCallTime.getTime();

    expect(analysisTime.getTime()).toBeGreaterThanOrEqual(beforeCallMs - 1000);
    expect(analysisTime.getTime()).toBeLessThanOrEqual(afterCallMs + 1000);
  });

  it('analysisTimestamp が UTC タイムゾーンで記録されている', async () => {
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15T09:00:00Z',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    const result = await onboardingAnalysisModule.analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    expect(result.analysisTimestamp).toEndWith('Z');
    const timestamp = result.analysisTimestamp;
    expect(timestamp).toMatch(/\d{3}Z$/);
  });

  it('複数回の呼び出しで異なる analysisTimestamp が記録される', async () => {
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15T09:00:00Z',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    const result1 = await onboardingAnalysisModule.analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const result2 = await onboardingAnalysisModule.analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    expect(result1.analysisTimestamp).not.toEqual(result2.analysisTimestamp);
    expect(new Date(result2.analysisTimestamp).getTime()).toBeGreaterThan(
      new Date(result1.analysisTimestamp).getTime()
    );
  });

  it('入力データが有効として処理されることを検証', async () => {
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15T09:00:00Z',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    await onboardingAnalysisModule.analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    expect(validateInputDataSpy).toHaveBeenCalled();
  });

  it('ピアワーカーグループが抽出されることを検証', async () => {
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15T09:00:00Z',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    await onboardingAnalysisModule.analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    expect(extractPeerWorkerGroupSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        jobClassification: 'ピッキング作業',
        assignmentSiteId: 'SITE-001',
      })
    );
  });

  it('過去30日間の生産性データが集約されることを検証', async () => {
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15T09:00:00Z',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    await onboardingAnalysisModule.analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    expect(aggregateHistoricalPerformanceDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        lookbackDays: 30,
      })
    );
  });
});