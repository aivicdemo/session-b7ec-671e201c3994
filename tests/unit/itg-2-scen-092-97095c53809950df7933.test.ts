import { runTx5Imp2Agent, Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-092: エージェント実行完了時にnotificationSentがtrueになる', () => {
  it('should complete execution with notificationSent set to true', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 85,
        domain: 'picking',
        recommendation: 'picker'
      },
      assignmentStartDate: '2025-01-15T00:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding'
    };

    const mockValidateInputData = jest.fn().mockResolvedValue({
      isValid: true,
      errors: []
    });

    const mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns = jest.fn().mockResolvedValue({
      phase: 'initial_assignment_recommendation',
      initialAssignmentRecommendation: {
        recommendedWorkTypeId: 'wt-001',
        recommendedWorkTypeName: 'standard_picking',
        recommendedDepartmentId: 'dept-001',
        recommendationReason: 'Based on aptitude test and peer patterns',
        peerPerformancePatterns: [
          {
            workTypeId: 'wt-001',
            workTypeName: 'standard_picking',
            averageProductivityRate: 85,
            averageQualityScore: 90,
            averageTimeToThreshold: 14
          }
        ],
        expectedProficiencyReachDays: 14
      }
    });

    const mockSendOnboardingAnalysisResultToManager = jest.fn().mockResolvedValue({
      notificationSent: true,
      timestamp: new Date().toISOString()
    });

    const result = await runTx5Imp2Agent(input, {
      validateInputData: mockValidateInputData,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns,
      sendOnboardingAnalysisResultToManager: mockSendOnboardingAnalysisResultToManager
    } as any);

    expect(result).toBeDefined();
    expect(result.notificationSent).toBe(true);
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect([
      'initial_assignment_recommendation',
      'monitoring_in_progress',
      'proficiency_threshold_reached',
      'monitoring_completed'
    ]).toContain(result.phase);
    expect(result.errors || []).toEqual([]);
  });
});