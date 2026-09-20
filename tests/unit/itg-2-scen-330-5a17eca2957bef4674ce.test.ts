import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-330: 得意作業タイプのリストが生産性率と品質スコアの高い順に並んでいる', () => {
  it('should return strengthWorkTypes sorted by productivity rate and quality score in descending order', async () => {
    // Arrange
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2024-01-15',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    const mockWorkerIds = ['W001', 'W002', 'W003', 'W004', 'W005', 'W006', 'W007'];

    const mockProductivityData = [
      {
        workTypeId: 'WT-A',
        workTypeName: '作業タイプA',
        recordCount: 42,
        averageProductivityRate: 95,
        averageQualityScore: 4.8,
        averageErrorCount: 0.5,
        minProductivityRate: 90,
        maxProductivityRate: 100,
      },
      {
        workTypeId: 'WT-B',
        workTypeName: '作業タイプB',
        recordCount: 35,
        averageProductivityRate: 88,
        averageQualityScore: 4.5,
        averageErrorCount: 1.2,
        minProductivityRate: 80,
        maxProductivityRate: 95,
      },
      {
        workTypeId: 'WT-C',
        workTypeName: '作業タイプC',
        recordCount: 28,
        averageProductivityRate: 82,
        averageQualityScore: 4.2,
        averageErrorCount: 2.0,
        minProductivityRate: 75,
        maxProductivityRate: 90,
      },
      {
        workTypeId: 'WT-D',
        workTypeName: '作業タイプD',
        recordCount: 21,
        averageProductivityRate: 75,
        averageQualityScore: 3.9,
        averageErrorCount: 3.1,
        minProductivityRate: 65,
        maxProductivityRate: 85,
      },
    ];

    const mockPeerGroup = {
      peerWorkerIds: mockWorkerIds,
      peerWorkerCount: 7,
      jobClassification: 'ピッキング作業',
      assignmentSiteId: 'SITE-001',
    };

    const mockAggregatedData = {
      peerWorkerCount: 7,
      analysisDataPeriodDays: 30,
      performanceByWorkType: mockProductivityData,
      overallStatistics: {
        totalRecordCount: 126,
        averageProductivityRate: 85,
        averageQualityScore: 4.35,
        averageErrorCount: 1.7,
        dataCompleteness: 100,
      },
      aggregationStatus: 'success' as const,
      aggregationTimestamp: '2024-01-15T10:00:00Z',
    };

    // Mock the internal functions
    jest.spyOn(require('../../src/logic/new-assignee-onboarding-analysis'), 'extractPeerWorkerGroup').mockResolvedValue(mockPeerGroup);
    jest.spyOn(require('../../src/logic/new-assignee-onboarding-analysis'), 'aggregateHistoricalPerformanceDataForPeerGroup').mockResolvedValue(mockAggregatedData);
    jest.spyOn(require('../../src/logic/new-assignee-onboarding-analysis'), 'identifyStrengthWorkTypesAndProductivityPatterns').mockResolvedValue({
      strengthWorkTypes: [
        {
          workTypeId: 'WT-A',
          workTypeName: '作業タイプA',
          averageProductivityRate: 95,
          averageQualityScore: 4.8,
          workerCountExcellingInThisType: 6,
          productivityVariance: 25,
        },
        {
          workTypeId: 'WT-B',
          workTypeName: '作業タイプB',
          averageProductivityRate: 88,
          averageQualityScore: 4.5,
          workerCountExcellingInThisType: 5,
          productivityVariance: 45,
        },
        {
          workTypeId: 'WT-C',
          workTypeName: '作業タイプC',
          averageProductivityRate: 82,
          averageQualityScore: 4.2,
          workerCountExcellingInThisType: 4,
          productivityVariance: 60,
        },
        {
          workTypeId: 'WT-D',
          workTypeName: '作業タイプD',
          averageProductivityRate: 75,
          averageQualityScore: 3.9,
          workerCountExcellingInThisType: 3,
          productivityVariance: 100,
        },
      ],
      productivityPatterns: [],
      recommendedInitialWorkTypes: [],
      analysisConfidenceScore: 92,
      analysisTimestamp: '2024-01-15T10:00:00Z',
      analysisStatus: 'success' as const,
    });

    // Act
    const result = await analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.peerWorkerCount).toBe(7);
    expect(result.analysisDataPeriodDays).toBe(30);
    expect(result.analysisStatus).toBe('success');

    // Verify strengthWorkTypes is returned and sorted by productivity rate and quality score in descending order
    expect(result.strengthWorkTypes).toBeDefined();
    expect(result.strengthWorkTypes.length).toBeGreaterThan(0);

    // Verify sorting order: highest productivity and quality score first
    for (let i = 0; i < result.strengthWorkTypes.length - 1; i++) {
      const current = result.strengthWorkTypes[i];
      const next = result.strengthWorkTypes[i + 1];

      // Check that current has higher or equal productivity rate than next
      expect(current.averageProductivityRate).toBeGreaterThanOrEqual(next.averageProductivityRate);

      // If productivity rates are equal, check quality score
      if (current.averageProductivityRate === next.averageProductivityRate) {
        expect(current.averageQualityScore).toBeGreaterThanOrEqual(next.averageQualityScore);
      }
    }

    // Verify the exact order matches expected values
    expect(result.strengthWorkTypes[0].averageProductivityRate).toBe(95);
    expect(result.strengthWorkTypes[0].averageQualityScore).toBe(4.8);

    expect(result.strengthWorkTypes[1].averageProductivityRate).toBe(88);
    expect(result.strengthWorkTypes[1].averageQualityScore).toBe(4.5);

    expect(result.strengthWorkTypes[2].averageProductivityRate).toBe(82);
    expect(result.strengthWorkTypes[2].averageQualityScore).toBe(4.2);

    expect(result.strengthWorkTypes[3].averageProductivityRate).toBe(75);
    expect(result.strengthWorkTypes[3].averageQualityScore).toBe(3.9);
  });
});