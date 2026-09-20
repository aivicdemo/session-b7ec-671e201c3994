import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';
import * as onboardingModule from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-319: 新配属者向けピアグループ分析 - 5人以上グループでのsuccess状態', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('同一拠点・同一職務分類の作業者が5人以上の場合、analysisStatus=success で完全分析結果を返す', async () => {
    const mockWorkers = [
      { id: 'worker1', name: 'Worker 1', workerId: 'worker1' },
      { id: 'worker2', name: 'Worker 2', workerId: 'worker2' },
      { id: 'worker3', name: 'Worker 3', workerId: 'worker3' },
      { id: 'worker4', name: 'Worker 4', workerId: 'worker4' },
      { id: 'worker5', name: 'Worker 5', workerId: 'worker5' },
    ];

    const mockProductivityData = mockWorkers.flatMap(worker =>
      Array.from({ length: 6 }, (_, i) => ({
        id: `prod-${worker.id}-${i}`,
        workerId: worker.id,
        workDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
        productivityRate: 80 + Math.random() * 15,
        qualityScore: 85 + Math.random() * 10,
        workTypeId: `worktype-${i % 3}`,
        workTypeName: `Work Type ${i % 3}`,
        completedItems: 50 + i * 5,
        actualWorkTime: 480,
      }))
    );

    const mockPerformanceRecords = mockWorkers.flatMap(worker =>
      Array.from({ length: 4 }, (_, i) => ({
        id: `perf-${worker.id}-${i}`,
        workerId: worker.id,
        recordDate: new Date(Date.now() - (25 - i * 7) * 24 * 60 * 60 * 1000).toISOString(),
        completedQuantity: 100 + i * 20,
        elapsedTimeMinutes: 480,
        qualityScore: 85,
      }))
    );

    jest.spyOn(onboardingModule, 'extractPeerWorkerGroup' as any).mockResolvedValue({
      peerWorkerIds: mockWorkers.map(w => w.id),
      peerWorkerCount: 5,
      jobClassification: 'ピッキング作業',
      assignmentSiteId: 'site-001',
    });

    jest.spyOn(onboardingModule, 'aggregateHistoricalPerformanceDataForPeerGroup' as any).mockResolvedValue({
      peerWorkerCount: 5,
      analysisDataPeriodDays: 30,
      performanceByWorkType: [
        {
          workTypeId: 'worktype-0',
          workTypeName: 'ピッキング基本',
          recordCount: 30,
          averageProductivityRate: 88,
          averageQualityScore: 89,
          averageErrorCount: 2,
          minProductivityRate: 75,
          maxProductivityRate: 95,
        },
        {
          workTypeId: 'worktype-1',
          workTypeName: 'ピッキング応用',
          recordCount: 30,
          averageProductivityRate: 85,
          averageQualityScore: 87,
          averageErrorCount: 3,
          minProductivityRate: 70,
          maxProductivityRate: 92,
        },
      ],
      overallStatistics: {
        totalRecordCount: 60,
        averageProductivityRate: 86.5,
        averageQualityScore: 88,
        averageErrorCount: 2.5,
        dataCompleteness: 95,
      },
      aggregationStatus: 'success',
      aggregationTimestamp: new Date().toISOString(),
    });

    jest.spyOn(onboardingModule, 'identifyStrengthWorkTypesAndProductivityPatterns' as any).mockResolvedValue({
      strengthWorkTypes: [
        {
          workTypeId: 'worktype-0',
          workTypeName: 'ピッキング基本',
          averageProductivityRate: 88,
          averageQualityScore: 89,
          workerCountExcellingInThisType: 5,
          productivityVariance: 12,
        },
        {
          workTypeId: 'worktype-1',
          workTypeName: 'ピッキング応用',
          averageProductivityRate: 85,
          averageQualityScore: 87,
          workerCountExcellingInThisType: 4,
          productivityVariance: 15,
        },
      ],
      productivityPatterns: [
        {
          patternName: '安定型',
          description: 'ピアグループの安定的な生産性パターン',
          averageProductivityRate: 87,
          averageQualityScore: 88,
          typicalWorkTypes: ['worktype-0', 'worktype-1'],
          applicableWorkerCount: 5,
          patternCharacteristics: {
            consistencyScore: 88,
            qualityStability: 89,
          },
        },
      ],
      recommendedInitialWorkTypes: [
        {
          workTypeId: 'worktype-0',
          workTypeName: 'ピッキング基本',
          recommendationReason: 'ピアグループの得意作業で習熟リスク最小',
          estimatedLearningCurve: 'rapid',
          riskLevel: 'low',
        },
      ],
      analysisConfidenceScore: 92,
      analysisTimestamp: new Date().toISOString(),
      analysisStatus: 'success',
    });

    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'site-001',
      assignmentDate: '2025-01-15',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'user-center-001',
    };

    const result = await analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    expect(result.newAssigneeName).toBe('山田太郎');
    expect(result.assignmentSiteId).toBe('site-001');
    expect(result.jobClassification).toBe('ピッキング作業');
    expect(result.peerWorkerCount).toBe(5);
    expect(result.analysisStatus).toBe('success');
    expect(result.analysisDataPeriodDays).toBe(30);

    expect(Array.isArray(result.strengthWorkTypes)).toBe(true);
    expect(result.strengthWorkTypes.length).toBeGreaterThan(0);
    expect(result.strengthWorkTypes[0]).toHaveProperty('workTypeId');
    expect(result.strengthWorkTypes[0]).toHaveProperty('workTypeName');
    expect(result.strengthWorkTypes[0]).toHaveProperty('averageProductivityRate');
    expect(result.strengthWorkTypes[0]).toHaveProperty('averageQualityScore');
    expect(result.strengthWorkTypes[0]).toHaveProperty('workerCountExcellingInThisType');

    expect(Array.isArray(result.productivityPatterns)).toBe(true);
    expect(result.productivityPatterns.length).toBeGreaterThan(0);
    expect(result.productivityPatterns[0]).toHaveProperty('patternName');
    expect(result.productivityPatterns[0]).toHaveProperty('description');
    expect(result.productivityPatterns[0]).toHaveProperty('averageProductivityRate');
    expect(result.productivityPatterns[0]).toHaveProperty('averageQualityScore');
    expect(result.productivityPatterns[0]).toHaveProperty('typicalWorkTypes');
    expect(result.productivityPatterns[0]).toHaveProperty('applicableWorkerCount');

    expect(Array.isArray(result.recommendedInitialWorkTypes)).toBe(true);
    expect(result.recommendedInitialWorkTypes.length).toBeGreaterThan(0);
    expect(result.recommendedInitialWorkTypes[0]).toHaveProperty('workTypeId');
    expect(result.recommendedInitialWorkTypes[0]).toHaveProperty('workTypeName');
    expect(result.recommendedInitialWorkTypes[0]).toHaveProperty('recommendationReason');
    expect(result.recommendedInitialWorkTypes[0]).toHaveProperty('estimatedLearningCurve');

    expect(result.analysisTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});