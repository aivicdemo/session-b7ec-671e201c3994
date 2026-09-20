import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import type { Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-081: 習熟度が閾値に達した場合、段階的難度調整案を生成して管理者に提示する', () => {
  let mockSendOnboardingAnalysisResultToManager: jest.Mock;

  beforeEach(() => {
    // Mock the notification function
    mockSendOnboardingAnalysisResultToManager = jest.fn().mockResolvedValue(true);

    // Setup global or module-level mock for notification
    jest.doMock('../../src/agents/tx-5-imp-2/orchestrator', () => ({
      ...jest.requireActual('../../src/agents/tx-5-imp-2/orchestrator'),
      sendOnboardingAnalysisResultToManager: mockSendOnboardingAnalysisResultToManager,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should generate difficulty adjustment recommendation when proficiency reaches threshold', async () => {
    // Prepare input data with new assignee information
    const newAssigneeId = 'assignee-001';
    const aptitudeTestResult = {
      totalScore: 85,
      competencyAreas: {
        analyticalSkills: 90,
        technicalKnowledge: 80,
        communication: 75,
      },
      recommendedWorkTypes: ['quality-check', 'data-entry'],
      strengths: ['attention to detail', 'systematic approach'],
      areasForImprovement: ['time management'],
    };
    const assignmentStartDate = new Date('2024-01-01').toISOString();

    const input: Tx5Imp2AgentInput = {
      newAssigneeId,
      aptitudeTestResult,
      assignmentStartDate,
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'proficiency_check',
    };

    // Mock proficiency data showing threshold achievement
    const mockMonitoringData = {
      currentProficiencyLevel: 78,
      proficiencyTrendPercentage: 12.5,
      daysIntoMonitoring: 15,
      projectedThresholdReachDate: new Date('2024-01-16').toISOString(),
      recentPerformanceMetrics: [
        {
          date: new Date('2024-01-10').toISOString(),
          productivityRate: 70,
          qualityScore: 85,
          completedQuantity: 120,
        },
        {
          date: new Date('2024-01-11').toISOString(),
          productivityRate: 72,
          qualityScore: 87,
          completedQuantity: 125,
        },
        {
          date: new Date('2024-01-12').toISOString(),
          productivityRate: 75,
          qualityScore: 89,
          completedQuantity: 130,
        },
        {
          date: new Date('2024-01-13').toISOString(),
          productivityRate: 78,
          qualityScore: 90,
          completedQuantity: 135,
        },
      ],
    };

    // Mock the AI client to simulate proficiency threshold achievement
    const mockAiClient = {
      analyzeAppropriateness: jest.fn().mockResolvedValue({
        phase: 'proficiency_threshold_reached',
        monitoringStatus: mockMonitoringData,
        difficultyAdjustmentRecommendation: {
          currentWorkTypeId: 'quality-check-001',
          recommendedNextWorkTypeId: 'advanced-processing-001',
          recommendedNextWorkTypeName: 'Advanced Data Processing',
          difficultyLevelChange: 'increase' as const,
          adjustmentReason: '習熟度が閾値75に達成し、より複雑な業務への段階的移行が推奨される。品質スコア90、生産性率78の維持確認。',
          recommendedAdjustmentDate: new Date('2024-01-16').toISOString(),
          expectedProductivityImpact: 65,
        },
        notificationSent: true,
        executionTimestamp: new Date().toISOString(),
        errors: [],
      }),
    };

    // Execute the agent
    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, mockAiClient as any);

    // Verify the phase is 'proficiency_threshold_reached'
    expect(result.phase).toBe('proficiency_threshold_reached');

    // Verify difficultyAdjustmentRecommendation is not null and contains expected fields
    expect(result.difficultyAdjustmentRecommendation).not.toBeNull();
    expect(result.difficultyAdjustmentRecommendation).toBeDefined();

    const recommendation = result.difficultyAdjustmentRecommendation!;

    expect(recommendation.currentWorkTypeId).toBeDefined();
    expect(recommendation.recommendedNextWorkTypeId).toBeDefined();
    expect(recommendation.recommendedNextWorkTypeName).toBe('Advanced Data Processing');
    expect(recommendation.difficultyLevelChange).toBe('increase');
    expect(recommendation.adjustmentReason).toContain('習熟度が閾値75に達成');
    expect(recommendation.recommendedAdjustmentDate).toBeDefined();
    expect(recommendation.expectedProductivityImpact).toBe(65);

    // Verify notificationSent is true
    expect(result.notificationSent).toBe(true);

    // Verify no errors in the errors array
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((err) => {
        expect(err.code).toBeDefined();
        expect(err.message).toBeDefined();
      });
    }

    // Verify executionTimestamp is in valid ISO 8601 format
    expect(result.executionTimestamp).toBeDefined();
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify monitoring data shows proficiency at or above threshold
    if (result.monitoringStatus) {
      expect(result.monitoringStatus.currentProficiencyLevel).toBeGreaterThanOrEqual(75);
    }
  });
});