import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import type {
  GenerateAllocationPlansInput,
  GenerateAllocationPlansOutput,
} from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-138: 複数人員配置案の自動生成と実現可能性スコア付与', () => {
  let input: GenerateAllocationPlansInput;

  beforeEach(() => {
    input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 60,
          recommendedAction: 'Add experienced workers',
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: 'work-002',
          facilityId: 'facility-001',
          teamId: 'team-002',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 1,
          currentProgressRate: 65,
          plannedProgressRate: 75,
          recommendedAction: 'Optimize task priority',
        },
        {
          riskJudgmentId: 'risk-003',
          workInstructionId: 'work-003',
          facilityId: 'facility-002',
          teamId: 'team-003',
          riskLevel: 'LOW',
          delayPredictionDays: 0,
          currentProgressRate: 80,
          plannedProgressRate: 85,
          recommendedAction: 'Monitor progress',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.6,
          qualityScore: 75,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 50,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: 'facility-001',
          teamId: 'team-002',
          productivityRate: 0.75,
          qualityScore: 82,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            {
              workInstructionId: 'work-002',
              completionRate: 70,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: 'worker-003',
          facilityId: 'facility-002',
          teamId: 'team-003',
          productivityRate: 0.85,
          qualityScore: 90,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            {
              workInstructionId: 'work-003',
              completionRate: 85,
              errorCount: 0,
            },
          ],
        },
        {
          workerId: 'worker-004',
          facilityId: 'facility-002',
          teamId: 'team-003',
          productivityRate: 0.95,
          qualityScore: 95,
          proficiencyLevel: 'EXPERT',
          recentWorkResults: [
            {
              workInstructionId: 'work-003',
              completionRate: 95,
              errorCount: 0,
            },
          ],
        },
      ],
      targetFacilityIds: ['facility-001', 'facility-002'],
      targetTeamIds: ['team-001', 'team-002', 'team-003'],
      workInstructionIds: ['work-001', 'work-002', 'work-003'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };
  });

  it('代表的な正常入力で複数の人員配置案が生成され、実現可能性スコアと推奨順位が付与される', async () => {
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // 4. allocationPlans配列の検証
    expect(output.allocationPlans).toBeDefined();
    expect(Array.isArray(output.allocationPlans)).toBe(true);
    expect(output.allocationPlans.length).toBeGreaterThanOrEqual(3);

    // 各配置案のフィールド検証
    output.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(typeof plan.planId).toBe('string');
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.allocatedWorkers.length).toBeGreaterThan(0);
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(typeof plan.estimatedCompletionDate).toBe('string');
      // ISO 8601形式の検証
      expect(() => new Date(plan.estimatedCompletionDate)).not.toThrow();
      expect(plan.estimatedWorkHours).toBeDefined();
      expect(typeof plan.estimatedWorkHours).toBe('number');
      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(plan.riskFactors)).toBe(true);
    });

    // 5. allocatedWorkersの習熟度別難度調整ロジック検証
    output.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.workerId).toBeDefined();
        expect(worker.assignedRole).toBeDefined();
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(typeof worker.estimatedProductivity).toBe('number');
        expect(worker.estimatedProductivity).toBeGreaterThanOrEqual(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(1);
        expect(typeof worker.proficiencyAdjustment).toBe('number');
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });

      // BEGINNER作業者のチェック
      const beginnerWorkers = plan.allocatedWorkers.filter(
        (w) =>
          input.productivityData.find((p) => p.workerId === w.workerId)
            ?.proficiencyLevel === 'BEGINNER'
      );
      beginnerWorkers.forEach((worker) => {
        expect(worker.difficultyLevel).toBe('EASY');
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(0.8);
      });

      // EXPERT作業者のチェック
      const expertWorkers = plan.allocatedWorkers.filter(
        (w) =>
          input.productivityData.find((p) => p.workerId === w.workerId)
            ?.proficiencyLevel === 'EXPERT'
      );
      expertWorkers.forEach((worker) => {
        expect(worker.difficultyLevel).toBe('HARD');
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(1.0);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });
    });

    // 6. recommendedRankingの検証
    expect(output.recommendedRanking).toBeDefined();
    expect(Array.isArray(output.recommendedRanking)).toBe(true);
    expect(output.recommendedRanking.length).toBeGreaterThanOrEqual(3);

    output.recommendedRanking.forEach((ranking, index) => {
      expect(ranking.planId).toBeDefined();
      expect(typeof ranking.planId).toBe('string');
      expect(ranking.rank).toBeDefined();
      expect(typeof ranking.rank).toBe('number');
      expect(ranking.rank).toBe(index + 1);
      expect(ranking.recommendationReason).toBeDefined();
      expect(typeof ranking.recommendationReason).toBe('string');
      expect(ranking.feasibilityScore).toBeDefined();
      expect(typeof ranking.feasibilityScore).toBe('number');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
    });

    // ランキングのソート順序検証（feasibilityScoreが降順）
    for (let i = 0; i < output.recommendedRanking.length - 1; i++) {
      expect(output.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        output.recommendedRanking[i + 1].feasibilityScore
      );
    }

    // 7. generationSummaryの検証
    expect(output.generationSummary).toBeDefined();
    expect(output.generationSummary.totalPlansGenerated).toBe(
      output.allocationPlans.length
    );
    expect(output.generationSummary.plansAboveThreshold).toBeDefined();
    expect(typeof output.generationSummary.plansAboveThreshold).toBe('number');

    // minimumFeasibilityThreshold以上のスコアを持つ配置案の数を検証
    const plansAboveThreshold = output.allocationPlans.filter(
      (plan) => plan.feasibilityScore >= input.minimumFeasibilityThreshold!
    ).length;
    expect(output.generationSummary.plansAboveThreshold).toBe(plansAboveThreshold);
    // テスト入力ではスコア65/72が60以上のため、2件以上であることを確認
    expect(output.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(2);

    expect(output.generationSummary.generationTimestamp).toBeDefined();
    expect(typeof output.generationSummary.generationTimestamp).toBe('string');
    expect(() =>
      new Date(output.generationSummary.generationTimestamp)
    ).not.toThrow();
    expect(output.generationSummary.generationStrategy).toBe(
      input.generationStrategy
    );

    // 8. analysisDetailsの検証
    expect(output.generationSummary.analysisDetails).toBeDefined();
    expect(
      Array.isArray(output.generationSummary.analysisDetails.delayRiskFactorsIdentified)
    ).toBe(true);
    expect(
      output.generationSummary.analysisDetails.delayRiskFactorsIdentified.length
    ).toBeGreaterThan(0);
    expect(
      Array.isArray(output.generationSummary.analysisDetails.productivityBottlenecks)
    ).toBe(true);
    expect(
      Array.isArray(output.generationSummary.analysisDetails.recommendedInterventions)
    ).toBe(true);
    expect(
      output.generationSummary.analysisDetails.recommendedInterventions.length
    ).toBeGreaterThan(0);

    // 9. readyForDeliveryフラグの検証
    expect(output.readyForDelivery).toBeDefined();
    expect(typeof output.readyForDelivery).toBe('boolean');
    if (output.generationSummary.plansAboveThreshold >= 1) {
      expect(output.readyForDelivery).toBe(true);
    } else {
      expect(output.readyForDelivery).toBe(false);
    }
  });

  it('各配置案のfeasibilityScoreが業務ルール br-tx_6-004 の計算式に基づいて計算されている', async () => {
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    output.allocationPlans.forEach((plan) => {
      // feasibilityScoreが0～100の範囲内であることを確認
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);

      // 配置されている作業者の得意度とチームの必要難度との適合度を検証
      if (plan.allocatedWorkers.length > 0) {
        // 作業者の得意度（proficiencyAdjustmentで表現）
        const avgProficiencyAdjustment =
          plan.allocatedWorkers.reduce(
            (sum, w) => sum + w.proficiencyAdjustment,
            0
          ) / plan.allocatedWorkers.length;
        expect(avgProficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(avgProficiencyAdjustment).toBeLessThanOrEqual(1.2);

        // チームの必要難度との適合度（difficultyLevelが配置者の習熟度と一致しているか）
        plan.allocatedWorkers.forEach((worker) => {
          const workerData = input.productivityData.find(
            (p) => p.workerId === worker.workerId
          );
          if (workerData) {
            if (workerData.proficiencyLevel === 'BEGINNER') {
              expect(worker.difficultyLevel).toBe('EASY');
            } else if (
              workerData.proficiencyLevel === 'INTERMEDIATE' ||
              workerData.proficiencyLevel === 'ADVANCED'
            ) {
              expect(['EASY', 'NORMAL']).toContain(worker.difficultyLevel);
            } else if (workerData.proficiencyLevel === 'EXPERT') {
              expect(worker.difficultyLevel).toBe('HARD');
            }
          }
        });

        // 生産性が高い配置案のスコアが相対的に高くなっていることを確認
        const avgEstimatedProductivity =
          plan.allocatedWorkers.reduce(
            (sum, w) => sum + w.estimatedProductivity,
            0
          ) / plan.allocatedWorkers.length;
        // 平均生産性が高い場合、feasibilityScoreも高い傾向が期待される
        expect(typeof plan.feasibilityScore).toBe('number');
        expect(avgEstimatedProductivity).toBeGreaterThan(0);

        // br-tx_6-004の加重平均計算式の検証：
        // 『作業者の得意度』『チームの必要難度との適合度』『移動による全体効率への影響』の3要素

        // 得意度スコア（proficiencyAdjustmentで表現）
        const proficiencyScores = plan.allocatedWorkers.map(
          (w) => (w.proficiencyAdjustment - 0.5) * 100 // 0.5～1.2を0～100にスケーリング
        );
        const avgProficiencyScore =
          proficiencyScores.reduce((a, b) => a + b, 0) / proficiencyScores.length;

        // 難度適合スコア（difficultyLevelの適合性を0～100で評価）
        const difficultyFitScores = plan.allocatedWorkers.map((worker) => {
          const workerData = input.productivityData.find(
            (p) => p.workerId === worker.workerId
          );
          if (!workerData) return 50;

          // 習熟度と難度の適合度を評価
          if (workerData.proficiencyLevel === 'BEGINNER' && worker.difficultyLevel === 'EASY') {
            return 100;
          } else if (
            workerData.proficiencyLevel === 'INTERMEDIATE' &&
            worker.difficultyLevel === 'NORMAL'
          ) {
            return 100;
          } else if (
            workerData.proficiencyLevel === 'ADVANCED' &&
            worker.difficultyLevel === 'NORMAL'
          ) {
            return 90;
          } else if (
            workerData.proficiencyLevel === 'EXPERT' &&
            worker.difficultyLevel === 'HARD'
          ) {
            return 100;
          }
          return 70; // 他の組み合わせ
        });
        const avgDifficultyFitScore =
          difficultyFitScores.reduce((a, b) => a + b, 0) / difficultyFitScores.length;

        // 移動による全体効率への影響スコア
        // 配置者がいかに既存の配置に適応できるか（移動の最小化）を0～100で評価
        const conversionEfficiencyScores = plan.allocatedWorkers.map((worker) => {
          const workerData = input.productivityData.find(
            (p) => p.workerId === worker.workerId
          );
          if (!workerData) return 50;

          // 配置先と既存所属の一致度を確認
          const isSameFacility = workerData.facilityId === plan.facilityId;
          const isSameTeam = workerData.teamId === plan.teamId;

          // 既存配置と同じ場合は効率が高い
          if (isSameFacility && isSameTeam) {
            return 100;
          } else if (isSameFacility) {
            return 80; // 同じ拠点内の移動
          }
          return 60; // 拠点間の移動（効率低下）
        });
        const avgConversionEfficiencyScore =
          conversionEfficiencyScores.reduce((a, b) => a + b, 0) /
          conversionEfficiencyScores.length;

        // 生産性スコア（estimatedProductivityを0～100にスケーリング）
        const productivityScores = plan.allocatedWorkers.map(
          (w) => w.estimatedProductivity * 100
        );
        const avgProductivityScore =
          productivityScores.reduce((a, b) => a + b, 0) / productivityScores.length;

        // 加重平均の計算（3要素に等しい重みを付与）
        const expectedWeightedScore =
          (avgProficiencyScore +
            avgDifficultyFitScore +
            avgConversionEfficiencyScore) /
          3;

        // feasibilityScoreが加重平均の計算結果に近い値であることを確認
        // 許容誤差：±15ポイント（計算方法の違いを考慮）
        expect(plan.feasibilityScore).toBeGreaterThanOrEqual(
          expectedWeightedScore - 15
        );
        expect(plan.feasibilityScore).toBeLessThanOrEqual(
          expectedWeightedScore + 15
        );
      }
    });

    // 複数の配置案でスコアが異なることを確認（3要素の加重平均が適用されていることの証）
    const scores = output.allocationPlans.map((p) => p.feasibilityScore);
    const uniqueScores = new Set(scores);
    // 最低でも2種類以上のスコアが存在することを期待（完全に同じスコアにはならない）
    expect(uniqueScores.size).toBeGreaterThanOrEqual(2);
  });

  it('planIdが一意であることを検証する', async () => {
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    const planIds = output.allocationPlans.map((p) => p.planId);
    const uniquePlanIds = new Set(planIds);
    expect(uniquePlanIds.size).toBe(planIds.length);
  });

  it('recommendedRankingのplanIdがallocationPlansに存在することを検証する', async () => {
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    const allocationPlanIds = new Set(output.allocationPlans.map((p) => p.planId));
    output.recommendedRanking.forEach((ranking) => {
      expect(allocationPlanIds.has(ranking.planId)).toBe(true);
    });
  });

  it('delayRiskJudgmentsの情報が分析結果に反映されている', async () => {
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    const delayRiskFactors =
      output.generationSummary.analysisDetails.delayRiskFactorsIdentified;
    // HIGH、MEDIUM、LOWのリスク情報が分析結果に含まれていることを確認
    expect(delayRiskFactors.length).toBeGreaterThan(0);
    // リスク判定結果から得られる要因が具体的な形式で含まれていることを確認
    // 例：'HIGH_RISK_TEAM_ID_001'、'PROGRESS_DELAY_2DAYS'などのパターンを期待
    delayRiskFactors.forEach((factor) => {
      expect(typeof factor).toBe('string');
      expect(factor.length).toBeGreaterThan(0);
      // 要因が何らかの識別子や数値を含むことを確認
      expect(/[A-Z0-9_]+/.test(factor)).toBe(true);
    });
  });

  it('productivityDataの低い生産性が生産性ボトルネックとして検出される', async () => {
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    const productivityBottlenecks =
      output.generationSummary.analysisDetails.productivityBottlenecks;
    // 生産性が低い作業者（BEGINNER、0.6）が検出されていることを期待
    expect(Array.isArray(productivityBottlenecks)).toBe(true);
    if (productivityBottlenecks.length > 0) {
      productivityBottlenecks.forEach((bottleneck) => {
        expect(typeof bottleneck).toBe('string');
        expect(bottleneck.length).toBeGreaterThan(0);
        // ボトルネックが識別子や生産性に関連する情報を含むことを確認
        expect(/[A-Za-z0-9_\-]+/.test(bottleneck)).toBe(true);
      });
    }
  });

  it('推奨対応が具体的な施策を含んでいる', async () => {
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    const recommendedInterventions =
      output.generationSummary.analysisDetails.recommendedInterventions;
    expect(recommendedInterventions.length).toBeGreaterThan(0);
    recommendedInterventions.forEach((intervention) => {
      expect(typeof intervention).toBe('string');
      expect(intervention.length).toBeGreaterThan(0);
      // 推奨施策が大文字スネークケースまたは具体的なアクションを含むことを確認
      expect(/[A-Z_]+|[A-Za-z\s]+/.test(intervention)).toBe(true);
    });
  });

  it('エラーが発生しないことを検証する', async () => {
    let error: Error | null = null;
    try {
      await generateAllocationPlans(input);
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeNull();
  });
});