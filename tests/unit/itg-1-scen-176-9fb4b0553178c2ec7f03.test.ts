import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-176: 複数の人員配置案生成と実現可能性スコアの付与', () => {
  it('スコアが高い順に配置案が並べられ、実行優先度が決定される', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RJ001',
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 0.45,
          plannedProgressRate: 0.70,
          recommendedAction: '増員対応',
        },
        {
          riskJudgmentId: 'RJ002',
          workInstructionId: 'WI002',
          facilityId: 'FAC001',
          teamId: 'TEAM002',
          riskLevel: 'MEDIUM' as const,
          delayPredictionDays: 1,
          currentProgressRate: 0.60,
          plannedProgressRate: 0.75,
          recommendedAction: '作業難度調整',
        },
      ],
      productivityData: [
        {
          workerId: 'W001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 1.2,
          qualityScore: 0.95,
          proficiencyLevel: 'ADVANCED' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.98,
              errorCount: 2,
            },
          ],
        },
        {
          workerId: 'W002',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 0.9,
          qualityScore: 0.88,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.92,
              errorCount: 5,
            },
          ],
        },
        {
          workerId: 'W003',
          facilityId: 'FAC001',
          teamId: 'TEAM002',
          productivityRate: 1.0,
          qualityScore: 0.9,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI002',
              completionRate: 0.85,
              errorCount: 8,
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

    const output = await generateAllocationPlans(input);

    // 出力に必要なフィールドが存在することを確認
    expect(output.allocationPlans).toBeDefined();
    expect(output.recommendedRanking).toBeDefined();
    expect(output.generationSummary).toBeDefined();
    expect(output.readyForDelivery).toBeDefined();

    // allocationPlansの各要素のfeasibilityScoreを記録
    const allocationPlansWithScores = output.allocationPlans.map((plan) => ({
      planId: plan.planId,
      feasibilityScore: plan.feasibilityScore,
    }));

    // recommendedRankingの各要素のrankを確認
    const ranksFromRecommendation = output.recommendedRanking.map(
      (rec) => rec.rank
    );

    // recommendedRankingがrank昇順でソートされているか検証
    const sortedRanks = [...ranksFromRecommendation].sort((a, b) => a - b);
    expect(ranksFromRecommendation).toEqual(sortedRanks);

    // recommendedRankingの各要素のfeasibilityScoreと対応するallocationPlansのfeasibilityScoreが一致することを確認
    output.recommendedRanking.forEach((rec) => {
      const matchingPlan = output.allocationPlans.find(
        (plan) => plan.planId === rec.planId
      );
      expect(matchingPlan).toBeDefined();
      expect(matchingPlan?.feasibilityScore).toEqual(rec.feasibilityScore);
    });

    // recommendedRankingの1番目（rank=1）のfeasibilityScoreが最も高いことを検証
    if (output.recommendedRanking.length >= 2) {
      const rank1Score = output.recommendedRanking.find(
        (r) => r.rank === 1
      )?.feasibilityScore;
      const rank2Score = output.recommendedRanking.find(
        (r) => r.rank === 2
      )?.feasibilityScore;
      expect(rank1Score).toBeGreaterThanOrEqual(rank2Score ?? 0);
    }

    // recommendedRankingの2番目（rank=2）以降との比較
    if (output.recommendedRanking.length >= 3) {
      const rank2Score = output.recommendedRanking.find(
        (r) => r.rank === 2
      )?.feasibilityScore;
      output.recommendedRanking
        .filter((r) => r.rank >= 3)
        .forEach((rec) => {
          expect(rank2Score).toBeGreaterThanOrEqual(rec.feasibilityScore);
        });
    }

    // plansAboveThresholdがminimumFeasibilityThreshold以上のfeasibilityScoreを持つ配置案の件数と一致
    const plansAboveThreshold = output.allocationPlans.filter(
      (plan) => plan.feasibilityScore >= input.minimumFeasibilityThreshold
    ).length;
    expect(output.generationSummary.plansAboveThreshold).toEqual(
      plansAboveThreshold
    );

    // readyForDeliveryがtrueであることを検証
    expect(output.readyForDelivery).toBe(true);

    // 習熟度段階別難度調整ロジックが適用されていることを確認
    output.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        // ADVANCEDレベルの作業者のチェック
        if (worker.workerId === 'W001') {
          // proficiencyAdjustmentが1.2（ADVANCED）であることを確認
          expect(worker.proficiencyAdjustment).toBe(1.2);
          // 難度レベルが適切に調整されていることを確認
          expect(['EASY', 'NORMAL', 'HARD']).toContain(
            worker.difficultyLevel
          );
        }
        // BEGINNERレベルの作業者のチェック
        if (worker.workerId === 'W003') {
          // proficiencyAdjustmentが0.5（BEGINNER）であることを確認
          expect(worker.proficiencyAdjustment).toBe(0.5);
          // 難度レベルがEASYに調整されていることを確認
          expect(worker.difficultyLevel).toBe('EASY');
        }
      });
    });

    // 推奨順位が高い配置案ほど、リスク・生産性とのマッチング度が良好であることを確認
    expect(output.recommendedRanking.length).toBeGreaterThan(0);
    const topRankedPlan = output.allocationPlans.find(
      (plan) =>
        plan.planId ===
        output.recommendedRanking.find((r) => r.rank === 1)?.planId
    );
    expect(topRankedPlan).toBeDefined();
    expect(topRankedPlan?.feasibilityScore).toBeGreaterThanOrEqual(
      input.minimumFeasibilityThreshold
    );
  });
});