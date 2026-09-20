import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-089: 習熟度監視フェーズの実行テスト', () => {
  it('triggeredBy=scheduled_monitoringの場合、習熟度監視フェーズを実行して段階的難度調整案を提示する', async () => {
    // Arrange
    const input = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 78,
        strengths: ['梱包', '仕分け'],
      },
      assignmentStartDate: '2024-01-15T00:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring',
    };

    // Act
    const output = await runTx5Imp2Agent(input, {
      validateInputData: async () => ({ valid: true }),
      findWorkerById: async () => ({
        workerId: 'A001',
        workerName: 'テスト作業者',
        department: '製造部',
        skillLevel: 3,
      }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
        peerPerformancePatterns: [
          {
            workTypeId: 'WT001',
            workTypeName: '梱包',
            averageProductivityRate: 85,
            averageQualityScore: 88,
            averageTimeToThreshold: 25,
          },
          {
            workTypeId: 'WT002',
            workTypeName: '仕分け',
            averageProductivityRate: 82,
            averageQualityScore: 85,
            averageTimeToThreshold: 28,
          },
          {
            workTypeId: 'WT003',
            workTypeName: '検査',
            averageProductivityRate: 78,
            averageQualityScore: 90,
            averageTimeToThreshold: 32,
          },
          {
            workTypeId: 'WT004',
            workTypeName: '組立',
            averageProductivityRate: 80,
            averageQualityScore: 87,
            averageTimeToThreshold: 30,
          },
          {
            workTypeId: 'WT005',
            workTypeName: '品質確認',
            averageProductivityRate: 76,
            averageQualityScore: 92,
            averageTimeToThreshold: 35,
          },
        ],
      }),
      aggregatePerformanceDataByPeriod: async () => ({
        currentProficiencyLevel: 82,
        proficiencyTrendPercentage: 8.5,
        daysIntoMonitoring: 28,
        projectedThresholdReachDate: '2024-02-10T00:00:00Z',
        recentPerformanceMetrics: [
          {
            date: '2024-02-07T00:00:00Z',
            productivityRate: 84,
            qualityScore: 88,
            completedQuantity: 45,
          },
          {
            date: '2024-02-06T00:00:00Z',
            productivityRate: 83,
            qualityScore: 87,
            completedQuantity: 44,
          },
          {
            date: '2024-02-05T00:00:00Z',
            productivityRate: 82,
            qualityScore: 86,
            completedQuantity: 43,
          },
          {
            date: '2024-02-04T00:00:00Z',
            productivityRate: 81,
            qualityScore: 85,
            completedQuantity: 42,
          },
          {
            date: '2024-02-03T00:00:00Z',
            productivityRate: 80,
            qualityScore: 84,
            completedQuantity: 40,
          },
          {
            date: '2024-02-02T00:00:00Z',
            productivityRate: 79,
            qualityScore: 83,
            completedQuantity: 39,
          },
          {
            date: '2024-02-01T00:00:00Z',
            productivityRate: 78,
            qualityScore: 82,
            completedQuantity: 38,
          },
        ],
      }),
      sendNotificationToAdmins: async () => ({ sent: true }),
    });

    // Assert
    expect(output).toBeDefined();
    expect(output.phase).toBe('proficiency_threshold_reached');
    
    expect(output.difficultyAdjustmentRecommendation).toBeDefined();
    expect(output.difficultyAdjustmentRecommendation?.currentWorkTypeId).toBe('WT001');
    expect(output.difficultyAdjustmentRecommendation?.recommendedNextWorkTypeId).toBeDefined();
    expect(output.difficultyAdjustmentRecommendation?.recommendedNextWorkTypeName).toBeDefined();
    expect(output.difficultyAdjustmentRecommendation?.difficultyLevelChange).toBe('increase');
    expect(output.difficultyAdjustmentRecommendation?.adjustmentReason).toBeDefined();
    expect(output.difficultyAdjustmentRecommendation?.recommendedAdjustmentDate).toBeDefined();
    expect(output.difficultyAdjustmentRecommendation?.expectedProductivityImpact).toBeGreaterThan(0);
    
    expect(output.notificationSent).toBe(true);
    
    expect(output.executionTimestamp).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('string');
    const timestamp = new Date(output.executionTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    
    expect(output.errors).toBeDefined();
    expect(Array.isArray(output.errors)).toBe(true);
    expect(output.errors.length).toBe(0);
  });
});