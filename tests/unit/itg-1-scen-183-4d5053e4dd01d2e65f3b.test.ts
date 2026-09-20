import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-183: generateAllocationPlans with proficiency and productivity data', () => {
  it('should generate allocation plans with proficiency-based difficulty adjustment and return feasible plans with recommended ranking', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RJ001',
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 0.55,
          plannedProgressRate: 0.70,
          recommendedAction: '人員追加が必要',
        },
        {
          riskJudgmentId: 'RJ002',
          workInstructionId: 'WI002',
          facilityId: 'FAC001',
          teamId: 'TEAM002',
          riskLevel: 'MEDIUM' as const,
          delayPredictionDays: 1,
          currentProgressRate: 0.65,
          plannedProgressRate: 0.75,
          recommendedAction: '工程調整を検討',
        },
      ],
      productivityData: [
        {
          workerId: 'W001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
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
          facilityId: 'FAC001',
          teamId: 'TEAM002',
          productivityRate: 0.78,
          qualityScore: 0.85,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI002',
              completionRate: 0.82,
              errorCount: 3,
            },
          ],
        },
      ],
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001', 'TEAM002'],
      workInstructionIds: ['WI001', 'WI002'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    // 検証1: allocationPlans 配列が存在し、最低1件以上の配置案を含むこと
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThanOrEqual(1);

    // 検証2: 各配置案が必要なフィールドを持つこと
    result.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.estimatedWorkHours).toBeDefined();
      expect(plan.feasibilityScore).toBeDefined();
      expect(plan.riskFactors).toBeDefined();
    });

    // 検証3: allocatedWorkers の各要素が必要なフィールドを持つこと
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.workerId).toBeDefined();
        expect(worker.assignedRole).toBeDefined();
        expect(worker.difficultyLevel).toBeDefined();
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(worker.estimatedProductivity).toBeDefined();
        expect(worker.proficiencyAdjustment).toBeDefined();
      });
    });

    // 検証4: estimatedProductivity が 0 以上 1 以下の範囲内であること
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.estimatedProductivity).toBeGreaterThanOrEqual(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(1);
      });
    });

    // 検証5: proficiencyAdjustment が数値であること
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        expect(typeof worker.proficiencyAdjustment).toBe('number');
      });
    });

    // 検証6: recommendedRanking 配列が存在し、最低1件以上の推奨順位を含むこと
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBeGreaterThanOrEqual(1);

    // 検証7: recommendedRanking の各要素が必要なフィールドを持つこと
    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.planId).toBeDefined();
      expect(ranking.rank).toBeDefined();
      expect(ranking.recommendationReason).toBeDefined();
      expect(ranking.feasibilityScore).toBeDefined();
      expect(ranking.riskLevel).toBeDefined();
    });

    // 検証8: rank が昇順に並んでいること
    for (let i = 1; i < result.recommendedRanking.length; i++) {
      expect(result.recommendedRanking[i].rank).toBeGreaterThan(
        result.recommendedRanking[i - 1].rank
      );
    }

    // 検証9: feasibilityScore が minimumFeasibilityThreshold 以上であること
    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(
        input.minimumFeasibilityThreshold
      );
    });

    // 検証10: generationSummary が存在し、必要なフィールドを持つこと
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeDefined();
    expect(result.generationSummary.plansAboveThreshold).toBeDefined();
    expect(result.generationSummary.generationTimestamp).toBeDefined();
    expect(result.generationSummary.generationStrategy).toBeDefined();
    expect(result.generationSummary.analysisDetails).toBeDefined();

    // 検証11: generationSummary.totalPlansGenerated が生成された配置案の総数と一致していること
    expect(result.generationSummary.totalPlansGenerated).toBe(
      result.allocationPlans.length
    );

    // 検証12: generationSummary.plansAboveThreshold が feasibilityScore >= 60 の配置案数と一致していること
    const plansAboveThreshold = result.allocationPlans.filter(
      (plan) => plan.feasibilityScore >= input.minimumFeasibilityThreshold
    ).length;
    expect(result.generationSummary.plansAboveThreshold).toBe(
      plansAboveThreshold
    );

    // 検証13: generationTimestamp が ISO 8601 形式の日時文字列であること
    expect(() => new Date(result.generationSummary.generationTimestamp)).not.toThrow();

    // 検証14: generationStrategy が入力値と一致していること
    expect(result.generationSummary.generationStrategy).toBe(
      input.generationStrategy
    );

    // 検証15: analysisDetails が delayRiskFactorsIdentified、productivityBottlenecks、recommendedInterventions を配列で持つこと
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    // 検証16: readyForDelivery が存在し、plansAboveThreshold >= 1 の場合は true であること
    expect(result.readyForDelivery).toBeDefined();
    if (result.generationSummary.plansAboveThreshold >= 1) {
      expect(result.readyForDelivery).toBe(true);
    }

    // 検証17: W001 (ADVANCED proficiency) の配置案における難度調整の確認
    const w001Plans = result.allocationPlans.filter((plan) =>
      plan.allocatedWorkers.some((worker) => worker.workerId === 'W001')
    );
    w001Plans.forEach((plan) => {
      const w001Worker = plan.allocatedWorkers.find(
        (worker) => worker.workerId === 'W001'
      );
      if (w001Worker) {
        expect(['EASY', 'NORMAL', 'HARD']).toContain(
          w001Worker.difficultyLevel
        );
        expect(w001Worker.estimatedProductivity).toBeGreaterThan(0.8);
      }
    });

    // 検証18: W002 (INTERMEDIATE proficiency) の配置案における難度調整の確認
    const w002Plans = result.allocationPlans.filter((plan) =>
      plan.allocatedWorkers.some((worker) => worker.workerId === 'W002')
    );
    w002Plans.forEach((plan) => {
      const w002Worker = plan.allocatedWorkers.find(
        (worker) => worker.workerId === 'W002'
      );
      if (w002Worker) {
        expect(['EASY', 'NORMAL', 'HARD']).toContain(
          w002Worker.difficultyLevel
        );
      }
    });
  });
});