import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-167: すべての割当案の実現可能性スコアが50未満のとき、警告が発生する', () => {
  it('すべての配置案の実現可能性スコアが50未満の場合、readyForDeliveryがfalseで警告が発生する', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: '追加人員配置',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.65,
          qualityScore: 72,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.42,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.58,
          qualityScore: 68,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.40,
              errorCount: 5,
            },
          ],
        },
        {
          workerId: 'worker-003',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.62,
          qualityScore: 70,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.44,
              errorCount: 4,
            },
          ],
        },
      ],
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 50,
      requestedBy: 'user-001',
    };

    const result = await generateAllocationPlans(input);

    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeLessThan(50);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(40);
    });

    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBe(0);

    expect(result.readyForDelivery).toBe(false);

    const analysisDetails = result.generationSummary.analysisDetails;
    expect(analysisDetails).toBeDefined();
    expect(analysisDetails.recommendedInterventions).toBeDefined();
    expect(Array.isArray(analysisDetails.recommendedInterventions)).toBe(true);
    const hasWarning = analysisDetails.recommendedInterventions.some(
      (intervention) =>
        intervention.includes('実現可能性が低い') ||
        intervention.includes('現場リーダーの判断'),
    );
    expect(hasWarning).toBe(true);
  });

  it('配置案が複数生成され、全て50未満で実現可能性順にランク付けされている', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: '追加人員配置',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.65,
          qualityScore: 72,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.42,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.58,
          qualityScore: 68,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.40,
              errorCount: 5,
            },
          ],
        },
        {
          workerId: 'worker-003',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.62,
          qualityScore: 70,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.44,
              errorCount: 4,
            },
          ],
        },
      ],
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 50,
      requestedBy: 'user-001',
    };

    const result = await generateAllocationPlans(input);

    const allPlansScore = result.allocationPlans.map((p) => p.feasibilityScore);
    const allScoresBelowThreshold = allPlansScore.every((score) => score < 50);
    expect(allScoresBelowThreshold).toBe(true);

    const rankedPlans = result.recommendedRanking;
    for (let i = 1; i < rankedPlans.length; i++) {
      expect(rankedPlans[i - 1].feasibilityScore).toBeGreaterThanOrEqual(
        rankedPlans[i].feasibilityScore,
      );
    }

    expect(result.generationSummary.plansAboveThreshold).toBe(0);
  });

  it('全配置案のスコアが閾値未満のとき、readyForDeliveryがfalseである', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: '追加人員配置',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.65,
          qualityScore: 72,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.42,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.58,
          qualityScore: 68,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.40,
              errorCount: 5,
            },
          ],
        },
        {
          workerId: 'worker-003',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.62,
          qualityScore: 70,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.44,
              errorCount: 4,
            },
          ],
        },
      ],
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 50,
      requestedBy: 'user-001',
    };

    const result = await generateAllocationPlans(input);

    expect(result.readyForDelivery).toBe(false);
  });
});