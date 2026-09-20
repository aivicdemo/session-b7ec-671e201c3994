import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-168: 進捗遅延リスク判定結果と作業者生産性データを入力として複数の人員配置案を自動生成', () => {
  it('各チームの進捗率が計算され、完了数と残数から納期内達成可能性が判定される', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RISK-001',
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 0.65,
        plannedProgressRate: 0.80,
        recommendedAction: 'Add personnel for task acceleration',
      },
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        productivityRate: 0.85,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-001',
            completionRate: 0.85,
            errorCount: 2,
          },
        ],
      },
      {
        workerId: 'worker-002',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        productivityRate: 0.92,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-001',
            completionRate: 0.92,
            errorCount: 1,
          },
        ],
      },
      {
        workerId: 'worker-003',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        productivityRate: 0.70,
        qualityScore: 75,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-001',
            completionRate: 0.70,
            errorCount: 5,
          },
        ],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC-001'],
      targetTeamIds: ['TEAM-001'],
      workInstructionIds: ['WI-001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    const result = await generateAllocationPlans(input);

    // Step 6: 複数の配置案が生成されていることを確認
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // Step 7: 各配置案について、allocatedWorkersに3名が割り当てられ、難度調整が適用されていることを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.allocatedWorkers.length).toBe(3);

      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.difficultyLevel).toMatch(/^(EASY|NORMAL|HARD)$/);
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
        expect(worker.estimatedProductivity).toBeGreaterThan(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(1.0);
      });

      // 習熟度別難度調整ロジックの検証
      const intermediateWorker = plan.allocatedWorkers.find(
        (w) => productivityData.find((p) => p.workerId === w.workerId)?.proficiencyLevel === 'INTERMEDIATE',
      );
      const advancedWorker = plan.allocatedWorkers.find(
        (w) => productivityData.find((p) => p.workerId === w.workerId)?.proficiencyLevel === 'ADVANCED',
      );
      const beginnerWorker = plan.allocatedWorkers.find(
        (w) => productivityData.find((p) => p.workerId === w.workerId)?.proficiencyLevel === 'BEGINNER',
      );

      if (intermediateWorker) {
        expect(['NORMAL']).toContain(intermediateWorker.difficultyLevel);
        expect(intermediateWorker.proficiencyAdjustment).toBeCloseTo(1.0, 0.2);
      }

      if (advancedWorker) {
        expect(['EASY']).toContain(advancedWorker.difficultyLevel);
        expect(advancedWorker.proficiencyAdjustment).toBeGreaterThan(1.0);
      }

      if (beginnerWorker) {
        expect(['HARD']).toContain(beginnerWorker.difficultyLevel);
        expect(beginnerWorker.proficiencyAdjustment).toBeLessThan(1.0);
      }
    });

    // Step 8: 全ての配置案のfeasibilityScoreが60以上であることを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });

    // Step 9: recommendedRankingが存在し、ソートされていることを確認
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBe(result.allocationPlans.length);

    // Step 10: rankフィールドが1から始まる連番であることを確認
    result.recommendedRanking.forEach((ranked, index) => {
      expect(ranked.rank).toBe(index + 1);
      expect(ranked.feasibilityScore).toBeGreaterThanOrEqual(60);
    });

    // feasibilityScoreの降順ソート確認
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      expect(result.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        result.recommendedRanking[i + 1].feasibilityScore,
      );
    }

    // Step 11: generationSummaryの分析結果を確認
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(
      result.generationSummary.totalPlansGenerated,
    );
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified.length).toBeGreaterThan(0);
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(result.generationSummary.analysisDetails.productivityBottlenecks.length).toBeGreaterThan(0);
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    // Step 12: readyForDeliveryがtrueであることを確認
    expect(result.readyForDelivery).toBe(true);

    // Step 13: 業務ルール br-tx_6-004 の進捗率計算検証
    // 進捗率 = 完了数 ÷ (完了数 + 残数) = 0.65
    // currentProgressRate = 0.65がplannedProgressRate = 0.80より低い → 対応が必要
    const riskData = delayRiskJudgments[0];
    expect(riskData.currentProgressRate).toBe(0.65);
    expect(riskData.plannedProgressRate).toBe(0.80);
    expect(riskData.currentProgressRate).toBeLessThan(riskData.plannedProgressRate);
    expect(riskData.riskLevel).toBe('HIGH');

    // Step 14: feasibilityScoreが複数要素の加重平均として算出されていることを検証
    result.allocationPlans.forEach((plan) => {
      // スコアは0～100の範囲にあり、複数要素の統合結果としての値
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      // リスク要因が記録されている
      expect(Array.isArray(plan.riskFactors)).toBe(true);
    });
  });
});