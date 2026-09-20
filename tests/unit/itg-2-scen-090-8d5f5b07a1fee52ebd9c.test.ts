import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-090: トリガーが\'proficiency_check\'の場合、習熟度閾値確認と難度調整判定を実行する', () => {
  it('should execute proficiency threshold check and difficulty adjustment judgment when triggered by proficiency_check', async () => {
    // Setup input parameters
    const input = {
      newAssigneeId: 'W001',
      aptitudeTestResult: {
        score: 78,
        strongFields: ['picking'],
        recommendedDuty: 'entry_level_picking',
      },
      assignmentStartDate: '2024-01-15T00:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'proficiency_check' as const,
    };

    // Execute the agent
    const result = await runTx5Imp2Agent(input, {
      findPerformanceRecordsByWorkerAndPeriod: jest.fn().mockResolvedValue([
        {
          date: '2024-02-10T00:00:00Z',
          productivityRate: 78,
          qualityScore: 97.9,
          completedQuantity: 320,
        },
      ]),
      aggregatePerformanceDataByPeriod: jest.fn().mockResolvedValue({
        currentProficiencyLevel: 78,
        proficiencyTrendPercentage: 8.5,
        daysIntoMonitoring: 26,
        projectedThresholdReachDate: '2024-02-10T00:00:00Z',
        recentPerformanceMetrics: [
          {
            date: '2024-02-10T00:00:00Z',
            productivityRate: 78,
            qualityScore: 97.9,
            completedQuantity: 320,
          },
        ],
      }),
      validateInputData: jest.fn().mockResolvedValue(true),
      sendOnboardingAnalysisResultToManager: jest.fn().mockResolvedValue(true),
    });

    // Verify phase is 'proficiency_threshold_reached'
    expect(result.phase).toBe('proficiency_threshold_reached');

    // Verify difficultyAdjustmentRecommendation is not null and is of correct type
    expect(result.difficultyAdjustmentRecommendation).not.toBeNull();
    expect(typeof result.difficultyAdjustmentRecommendation).toBe('object');
    expect(result.difficultyAdjustmentRecommendation).toHaveProperty('currentWorkTypeId');
    expect(result.difficultyAdjustmentRecommendation).toHaveProperty('recommendedNextWorkTypeId');
    expect(result.difficultyAdjustmentRecommendation).toHaveProperty('recommendedNextWorkTypeName');
    expect(result.difficultyAdjustmentRecommendation).toHaveProperty('difficultyLevelChange');
    expect(result.difficultyAdjustmentRecommendation).toHaveProperty('adjustmentReason');
    expect(result.difficultyAdjustmentRecommendation).toHaveProperty('recommendedAdjustmentDate');
    expect(result.difficultyAdjustmentRecommendation).toHaveProperty('expectedProductivityImpact');

    // Verify notificationSent is true
    expect(result.notificationSent).toBe(true);

    // Verify executionTimestamp is in ISO 8601 format
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify errors is empty or undefined
    expect(result.errors).toBeDefined();
    if (Array.isArray(result.errors)) {
      expect(result.errors).toHaveLength(0);
    }

    // Verify monitoring status is null (as it's not the monitoring_in_progress phase)
    expect(result.monitoringStatus).toBeNull();

    // Verify initialAssignmentRecommendation is null (as we're in a later phase)
    expect(result.initialAssignmentRecommendation).toBeNull();

    // Verify monitoringCompletionSummary is null (as we're not at completion yet)
    expect(result.monitoringCompletionSummary).toBeNull();
  });
});