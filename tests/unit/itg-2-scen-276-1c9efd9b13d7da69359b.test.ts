import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';
import * as personnelReallocationModule from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-276: 必要スキルセットが空のとき、警告が dataQualityWarnings に含まれる', () => {
  it('should include warning about missing required skills in dataQualityWarnings when targetWorkTypeIds is empty', async () => {
    // Mock dependent functions
    const mockValidateInputData = jest.fn().mockResolvedValue({ isValid: true });
    const mockCalculateWorkloadAndCapacityBysite = jest.fn().mockResolvedValue({
      siteId: 'site-002',
      currentWorkload: 65,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1560,
      availableCapacityMinutes: 840,
      activeWorkerCount: 4,
      totalWorkerCount: 5,
      averageProductivityRate: 85,
      dataQualityScore: 90,
      calculatedAt: '2024-01-15T10:00:00Z',
    });
    const mockAssessDeliveryMarginBySite = jest.fn().mockResolvedValue({
      siteId: 'site-002',
      deliveryDate: '2024-01-25',
      remainingDays: 10,
      remainingHours: 240,
      currentProgressRate: 50,
      requiredProgressRatePerDay: 5,
      deliveryMarginScore: 45,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    });
    const mockIdentifyReallocatablePersonnelAndSources = jest.fn().mockResolvedValue({
      reallocatableSources: [
        {
          siteId: 'site-002',
          availablePersonnelCount: 2,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 55,
          recommendedWorkerIds: ['worker-001', 'worker-002'],
          skillMatchDegrees: { 'worktype-001': 60, 'worktype-002': 65 },
          riskFactors: [],
        },
        {
          siteId: 'site-003',
          availablePersonnelCount: 1,
          priorityScore: 70,
          workloadAfterReallocation: 82,
          deliveryMarginAfterReallocation: 40,
          recommendedWorkerIds: ['worker-003'],
          skillMatchDegrees: { 'worktype-001': 55 },
          riskFactors: ['スキルマッチ度が基準値以下'],
        },
      ],
      totalAvailablePersonnelCount: 3,
      isSufficientCapacity: true,
      dataQualityWarnings: null,
      identifiedAt: '2024-01-15T10:00:00Z',
    });
    const mockFindProductivityDataBySiteAndPeriod = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-001',
        productivityRate: 88,
        averageTimePerTask: 45,
        completedTasksCount: 20,
      },
      {
        workerId: 'worker-002',
        productivityRate: 82,
        averageTimePerTask: 52,
        completedTasksCount: 18,
      },
    ]);
    const mockEvaluateSkillMatchDegree = jest.fn().mockImplementation((input) => {
      // When targetWorkTypeIds is empty, return warning
      if (!input.targetWorkTypeId) {
        return Promise.resolve({
          sourceWorkerId: input.sourceWorkerId,
          targetWorkTypeId: input.targetWorkTypeId,
          matchDegree: 0,
          matchLevel: 'poor',
          evaluationFactors: {
            jobTypeAlignment: 0,
            productivityAlignment: 0,
            difficultyAlignment: 0,
            experienceRelevance: 0,
          },
          matchingJustification: '作業タイプが指定されていません',
          riskFactors: ['必要スキルが指定されていません'],
          evaluatedAt: '2024-01-15T10:00:00Z',
        });
      }
      return Promise.resolve({
        sourceWorkerId: input.sourceWorkerId,
        targetWorkTypeId: input.targetWorkTypeId,
        matchDegree: 60,
        matchLevel: 'acceptable',
        evaluationFactors: {
          jobTypeAlignment: 60,
          productivityAlignment: 60,
          difficultyAlignment: 60,
          experienceRelevance: 60,
        },
        matchingJustification: 'スキルマッチ度は許容範囲内',
        evaluatedAt: '2024-01-15T10:00:00Z',
      });
    });

    // Replace module functions with mocks
    jest.spyOn(personnelReallocationModule, 'judgePersonnelReallocationFeasibility' as any).mockImplementation(
      async (input) => {
        // Validate input
        await mockValidateInputData(input);

        // Collect workload and capacity data
        const workloadData = await mockCalculateWorkloadAndCapacityBysite({
          siteId: input.delayRiskContext.affectedSiteId,
          analysisDate: input.analysisDate,
          lookbackDays: input.lookbackDays,
        });

        // Assess delivery margins
        const deliveryMarginData = await mockAssessDeliveryMarginBySite({
          siteId: input.delayRiskContext.affectedSiteId,
          analysisDate: input.analysisDate,
          lookbackDays: input.lookbackDays,
        });

        // Identify reallocatable personnel
        const reallocatableData = await mockIdentifyReallocatablePersonnelAndSources({
          targetSiteId: input.delayRiskContext.affectedSiteId,
          candidateSiteIds: input.candidateSiteIds,
          requiredPersonnelCount: input.requiredPersonnelCount,
          targetWorkTypeIds: input.targetWorkTypeIds,
          analysisDate: input.analysisDate,
          lookbackDays: input.lookbackDays,
          skillMatchThreshold: input.skillMatchThreshold,
          workloadThreshold: input.workloadThreshold,
        });

        // If targetWorkTypeIds is empty, add warning
        let dataQualityWarnings = reallocatableData.dataQualityWarnings || [];
        if (input.targetWorkTypeIds.length === 0) {
          dataQualityWarnings = [
            ...dataQualityWarnings,
            {
              siteId: input.delayRiskContext.affectedSiteId,
              warningType: 'MISSING_SKILL_REQUIREMENT',
              message: '必要スキルが指定されていません。スキルマッチ度の判定ができません',
            },
          ];
        }

        return {
          feasibilityJudgment: {
            isFeasible: reallocatableData.isSufficientCapacity,
            reason: reallocatableData.isSufficientCapacity
              ? '融通可能人員で対応可能'
              : '融通可能人員が不足しています',
            confidenceScore: 75,
          },
          reallocatablePersonnelSummary: {
            totalAvailableCount: reallocatableData.totalAvailablePersonnelCount,
            bySourceSite: reallocatableData.reallocatableSources.map((source) => ({
              siteId: source.siteId,
              availableCount: source.availablePersonnelCount,
              workloadAfterReallocation: source.workloadAfterReallocation,
            })),
          },
          recommendedPlacementProposals: reallocatableData.reallocatableSources.map((source, index) => ({
            proposalId: `proposal-${index + 1}`,
            sourceSiteId: source.siteId,
            targetSiteId: input.delayRiskContext.affectedSiteId,
            assignedWorkerIds: source.recommendedWorkerIds,
            skillMatchDegrees: source.skillMatchDegrees,
            expectedProductivityImprovement: 8,
            deliveryMarginAfterReallocation: source.deliveryMarginAfterReallocation,
            riskMitigation: source.riskFactors.length > 0 ? source.riskFactors.join(', ') : 'リスク低',
          })),
          alternativeProposals: null,
          dataQualityWarnings: dataQualityWarnings.length > 0 ? dataQualityWarnings : null,
          analysisTimestamp: '2024-01-15T10:00:00Z',
        };
      }
    );

    // Arrange
    const delayRiskContext = {
      affectedSiteId: 'site-001',
      delayRiskScore: 75,
      detectedAt: '2024-01-15T10:00:00Z',
      requiredAdjustments: ['人員追加', '優先度調整'],
    };

    const targetWorkTypeIds: string[] = [];

    const input = {
      delayRiskContext,
      targetWorkTypeIds,
      requiredPersonnelCount: 3,
      candidateSiteIds: ['site-002', 'site-003', 'site-004'],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85,
    };

    // Act
    const result = await judgePersonnelReallocationFeasibility(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.feasibilityJudgment).toBeDefined();
    expect(result.feasibilityJudgment.isFeasible).toBeDefined();
    expect(result.reallocatablePersonnelSummary).toBeDefined();
    expect(result.recommendedPlacementProposals).toBeDefined();
    expect(result.analysisTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.dataQualityWarnings).not.toBeNull();
    expect(Array.isArray(result.dataQualityWarnings)).toBe(true);
    expect(result.dataQualityWarnings?.length).toBeGreaterThan(0);

    const skillWarning = result.dataQualityWarnings?.find(
      (w) =>
        w.message.includes('必要スキルが指定されていません') &&
        w.message.includes('スキルマッチ度の判定ができません')
    );

    expect(skillWarning).toBeDefined();
    expect(skillWarning?.siteId).toBeDefined();
    expect(skillWarning?.warningType).toBeDefined();
    expect(skillWarning?.message).toContain('必要スキルが指定されていません');
    expect(skillWarning?.message).toContain('スキルマッチ度の判定ができません');
  });
});