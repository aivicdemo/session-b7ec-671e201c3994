import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import type { Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-086: monitoringDurationDaysデフォルト値テスト', () => {
  it('monitoringDurationDaysが指定されない場合、デフォルト値30日で習熟度監視を実行する', async () => {
    // Arrange
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'W001',
      aptitudeTestResult: {
        score: 80,
        strengths: ['analytical', 'detail-oriented'],
        recommendedDuties: 'quality_inspection'
      },
      assignmentStartDate: '2024-01-15',
      proficiencyThreshold: 75,
      triggeredBy: 'scheduled_monitoring'
      // monitoringDurationDaysは明示的に指定しない
    };

    // Act
    const output: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, {
      validateInputData: async (data) => {
        return {
          isValid: true,
          errors: []
        };
      },
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async (context) => {
        // monitoringDurationDaysがデフォルト30で使用されることを確認
        expect(context.monitoringDurationDays).toBe(30);
        return {
          peerPatterns: [
            {
              workTypeId: 'WT001',
              workTypeName: 'Quality Inspection',
              averageProductivityRate: 85,
              averageQualityScore: 88,
              averageTimeToThreshold: 18
            }
          ],
          recommendedWorkTypeId: 'WT001',
          recommendedWorkTypeName: 'Quality Inspection',
          recommendedDepartmentId: 'DEPT001'
        };
      },
      aggregatePerformanceDataByPeriod: async (params) => {
        // 監視期間が『2024-01-15』から『2024-02-14』（30日間）であることを確認
        const startDate = new Date('2024-01-15');
        const expectedEndDate = new Date('2024-02-14');
        expect(new Date(params.startDate)).toEqual(startDate);
        expect(new Date(params.endDate)).toEqual(expectedEndDate);
        
        return {
          periodDays: 30,
          performanceMetrics: [
            {
              date: '2024-01-15',
              productivityRate: 70,
              qualityScore: 75,
              completedQuantity: 45
            },
            {
              date: '2024-01-22',
              productivityRate: 78,
              qualityScore: 82,
              completedQuantity: 52
            },
            {
              date: '2024-02-14',
              productivityRate: 85,
              qualityScore: 88,
              completedQuantity: 61
            }
          ]
        };
      },
      calculateProficiencyTrend: async (metrics) => {
        return {
          currentLevel: 82,
          trendPercentage: 16.7,
          projectedThresholdReachDate: '2024-02-05'
        };
      },
      generateDifficultyAdjustmentRecommendation: async (context) => {
        return {
          currentWorkTypeId: 'WT001',
          recommendedNextWorkTypeId: 'WT002',
          recommendedNextWorkTypeName: 'Advanced Quality Inspection',
          difficultyLevelChange: 'increase' as const,
          adjustmentReason: '習熟度が閾値を超過し、次段階への移行に適切なタイミング',
          recommendedAdjustmentDate: '2024-02-14',
          expectedProductivityImpact: 80
        };
      },
      notifyAdmins: async (notification) => {
        return { sent: true };
      }
    });

    // Assert
    expect(output).toBeDefined();
    expect(output.notificationSent).toBe(true);
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(output.errors).toEqual([]);
    
    // phaseが期待される値のいずれかであることを確認
    expect(['initial_assignment_recommendation', 'monitoring_in_progress', 'proficiency_threshold_reached', 'monitoring_completed']).toContain(output.phase);
    
    // monitoringStatusまたはdifficultyAdjustmentRecommendationまたはmonitoringCompletionSummaryのいずれかが填充されている
    const hasRelevantOutput = 
      output.monitoringStatus !== null ||
      output.difficultyAdjustmentRecommendation !== null ||
      output.monitoringCompletionSummary !== null;
    expect(hasRelevantOutput).toBe(true);
  });

  it('monitoringDurationDaysが明示的に指定された場合、その値が使用される', async () => {
    // Arrange
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'W002',
      aptitudeTestResult: {
        score: 75,
        strengths: ['communication', 'teamwork'],
        recommendedDuties: 'assembly'
      },
      assignmentStartDate: '2024-01-01',
      monitoringDurationDays: 14,
      proficiencyThreshold: 70,
      triggeredBy: 'proficiency_check'
    };

    // Act
    const output: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, {
      validateInputData: async (data) => {
        return { isValid: true, errors: [] };
      },
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async (context) => {
        // 指定された14日が使用されることを確認
        expect(context.monitoringDurationDays).toBe(14);
        return {
          peerPatterns: [
            {
              workTypeId: 'WT002',
              workTypeName: 'Assembly',
              averageProductivityRate: 80,
              averageQualityScore: 85,
              averageTimeToThreshold: 12
            }
          ],
          recommendedWorkTypeId: 'WT002',
          recommendedWorkTypeName: 'Assembly',
          recommendedDepartmentId: 'DEPT002'
        };
      },
      aggregatePerformanceDataByPeriod: async (params) => {
        // 監視期間が『2024-01-01』から『2024-01-14』（14日間）であることを確認
        const startDate = new Date('2024-01-01');
        const expectedEndDate = new Date('2024-01-14');
        expect(new Date(params.startDate)).toEqual(startDate);
        expect(new Date(params.endDate)).toEqual(expectedEndDate);
        
        return {
          periodDays: 14,
          performanceMetrics: [
            {
              date: '2024-01-01',
              productivityRate: 65,
              qualityScore: 70,
              completedQuantity: 40
            },
            {
              date: '2024-01-14',
              productivityRate: 76,
              qualityScore: 80,
              completedQuantity: 54
            }
          ]
        };
      },
      calculateProficiencyTrend: async (metrics) => {
        return {
          currentLevel: 75,
          trendPercentage: 16.9,
          projectedThresholdReachDate: '2024-01-10'
        };
      },
      generateDifficultyAdjustmentRecommendation: async (context) => {
        return {
          currentWorkTypeId: 'WT002',
          recommendedNextWorkTypeId: 'WT003',
          recommendedNextWorkTypeName: 'Advanced Assembly',
          difficultyLevelChange: 'increase' as const,
          adjustmentReason: '短期で習熟度が進展し、次段階への移行に適切',
          recommendedAdjustmentDate: '2024-01-14',
          expectedProductivityImpact: 78
        };
      },
      notifyAdmins: async (notification) => {
        return { sent: true };
      }
    });

    // Assert
    expect(output).toBeDefined();
    expect(output.notificationSent).toBe(true);
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(output.errors).toEqual([]);
  });
});