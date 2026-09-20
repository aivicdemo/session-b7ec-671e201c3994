import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-158: 遅延リスク判定結果から遅延要因が特定される', () => {
  it('should identify delay risk factors and generate allocation plans with feasibility scores', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RJ001',
          workInstructionId: 'WI001',
          facilityId: 'F001',
          teamId: 'T001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 0.45,
          plannedProgressRate: 0.70,
          recommendedAction: 'personnel_reinforcement',
        },
        {
          riskJudgmentId: 'RJ002',
          workInstructionId: 'WI002',
          facilityId: 'F001',
          teamId: 'T002',
          riskLevel: 'MEDIUM' as const,
          delayPredictionDays: 1,
          currentProgressRate: 0.60,
          plannedProgressRate: 0.75,
          recommendedAction: 'priority_adjustment',
        },
        {
          riskJudgmentId: 'RJ003',
          workInstructionId: 'WI003',
          facilityId: 'F002',
          teamId: 'T003',
          riskLevel: 'LOW' as const,
          delayPredictionDays: 0,
          currentProgressRate: 0.85,
          plannedProgressRate: 0.85,
          recommendedAction: 'monitoring',
        },
      ],
      productivityData: [
        {
          workerId: 'W001',
          facilityId: 'F001',
          teamId: 'T001',
          productivityRate: 0.95,
          qualityScore: 0.92,
          proficiencyLevel: 'ADVANCED' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.98,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: 'W002',
          facilityId: 'F001',
          teamId: 'T001',
          productivityRate: 0.72,
          qualityScore: 0.85,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.70,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'W003',
          facilityId: 'F001',
          teamId: 'T002',
          productivityRate: 0.88,
          qualityScore: 0.88,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI002',
              completionRate: 0.85,
              errorCount: 2,
            },
          ],
        },
        {
          workerId: 'W004',
          facilityId: 'F002',
          teamId: 'T003',
          productivityRate: 0.92,
          qualityScore: 0.90,
          proficiencyLevel: 'ADVANCED' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI003',
              completionRate: 0.95,
              errorCount: 1,
            },
          ],
        },
      ],
      targetFacilityIds: ['F001', 'F002'],
      targetTeamIds: ['T001', 'T002', 'T003'],
      workInstructionIds: ['WI001', 'WI002', 'WI003'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    // 1. generationSummary.analysisDetails.delayRiskFactorsIdentified が文字列配列型であることを確認
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);

    // 最低3件以上の遅延要因文字列が配列に格納されることを確認
    expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified.length).toBeGreaterThanOrEqual(3);

    // HIGH と MEDIUM リスク要因が実際に含まれていることを確認
    const delayFactors = result.generationSummary.analysisDetails.delayRiskFactorsIdentified;
    const hasHighRiskFactor = delayFactors.some((factor) =>
      factor.toLowerCase().includes('high') && factor.toLowerCase().includes('t001')
    );
    const hasMediumRiskFactor = delayFactors.some((factor) =>
      factor.toLowerCase().includes('medium') && factor.toLowerCase().includes('t002')
    );
    expect(hasHighRiskFactor).toBe(true);
    expect(hasMediumRiskFactor).toBe(true);

    // 2. generationSummary.totalPlansGenerated が1以上であることを確認
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);

    // 3. generationSummary.plansAboveThreshold が feasibilityScore >= 60 の配置案の件数と一致することを確認
    const plansAboveThreshold = result.allocationPlans.filter(
      (plan) => plan.feasibilityScore >= 60
    ).length;
    expect(result.generationSummary.plansAboveThreshold).toBe(plansAboveThreshold);

    // 4. generationSummary.generationTimestamp が ISO 8601形式のタイムスタンプであることを確認
    const timestamp = new Date(result.generationSummary.generationTimestamp);
    expect(timestamp instanceof Date && !isNaN(timestamp.getTime())).toBe(true);

    // 5. generationSummary.generationStrategy が 'balance_risk_and_efficiency' であることを確認
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');

    // 6. generationSummary.analysisDetails.productivityBottlenecks が文字列配列型であることを確認
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);

    // 生産性が低い作業者（productivityRate < 0.75）が特定されていることを確認
    const lowProductivityWorkers = input.productivityData.filter((w) => w.productivityRate < 0.75);
    if (lowProductivityWorkers.length > 0) {
      expect(result.generationSummary.analysisDetails.productivityBottlenecks.length).toBeGreaterThan(0);
    }

    // 7. generationSummary.analysisDetails.recommendedInterventions が文字列配列型であることを確認
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    // HIGH または MEDIUM リスク判定が存在する場合、推奨対応が存在することを確認
    const hasHighOrMediumRisk = input.delayRiskJudgments.some((rj) =>
      rj.riskLevel === 'HIGH' || rj.riskLevel === 'MEDIUM'
    );
    if (hasHighOrMediumRisk) {
      expect(result.generationSummary.analysisDetails.recommendedInterventions.length).toBeGreaterThan(0);
    }

    // 8. readyForDelivery が正しく設定されていることを確認
    const shouldBeReady =
      result.generationSummary.plansAboveThreshold > 0 &&
      result.allocationPlans.every((plan) => plan.allocatedWorkers && plan.allocatedWorkers.length > 0);
    expect(result.readyForDelivery).toBe(shouldBeReady);

    // 9. delayRiskFactorsIdentified に記録された遅延要因が HIGH/MEDIUM リスク判定結果をカバーしていることを確認
    const highAndMediumRisks = input.delayRiskJudgments.filter(
      (rj) => rj.riskLevel === 'HIGH' || rj.riskLevel === 'MEDIUM'
    );
    if (highAndMediumRisks.length > 0) {
      expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified.length).toBeGreaterThan(0);
    }

    // allocationPlans が配列であり、推奨順位フィールドが存在することを確認
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(Array.isArray(result.recommendedRanking)).toBe(true);

    // recommendedRanking が feasibilityScore の降順でソートされていることを確認
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      const currentRank = result.recommendedRanking[i];
      const nextRank = result.recommendedRanking[i + 1];
      expect(currentRank.feasibilityScore).toBeGreaterThanOrEqual(nextRank.feasibilityScore);
    }
  });
});