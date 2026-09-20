import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-175: 進捗遅延リスク判定結果と作業者生産性データから複数配置案を自動生成', () => {
  it('マッチング度に基づいて配置対象者が推奨され、各配置案にスコア（0-100）が付与される', async () => {
    // 準備：進捗遅延リスク判定結果
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 60,
        plannedProgressRate: 75,
        recommendedAction: '追加人員による作業加速が必要',
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'work-002',
        facilityId: 'facility-001',
        teamId: 'team-002',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 5,
        currentProgressRate: 70,
        plannedProgressRate: 80,
        recommendedAction: '進捗監視が必要',
      },
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'work-003',
        facilityId: 'facility-002',
        teamId: 'team-003',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 7,
        currentProgressRate: 80,
        plannedProgressRate: 85,
        recommendedAction: '通常進行',
      },
    ];

    // 準備：作業者生産性データ
    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 95,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          { workInstructionId: 'work-001', completionRate: 0.98, errorCount: 0 },
        ],
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.85,
        qualityScore: 88,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          { workInstructionId: 'work-001', completionRate: 0.92, errorCount: 1 },
        ],
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-002',
        productivityRate: 0.70,
        qualityScore: 75,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          { workInstructionId: 'work-002', completionRate: 0.80, errorCount: 2 },
        ],
      },
      {
        workerId: 'worker-004',
        facilityId: 'facility-002',
        teamId: 'team-003',
        productivityRate: 0.55,
        qualityScore: 65,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          { workInstructionId: 'work-003', completionRate: 0.60, errorCount: 5 },
        ],
      },
      {
        workerId: 'worker-005',
        facilityId: 'facility-002',
        teamId: 'team-003',
        productivityRate: 0.80,
        qualityScore: 82,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          { workInstructionId: 'work-003', completionRate: 0.85, errorCount: 1 },
        ],
      },
    ];

    // 入力値
    const targetFacilityIds = ['facility-001', 'facility-002'];
    const targetTeamIds = ['team-001', 'team-002', 'team-003'];
    const workInstructionIds = ['work-001', 'work-002', 'work-003'];
    const generationStrategy = 'balance_risk_and_efficiency' as const;
    const minimumFeasibilityThreshold = 60;
    const requestedBy = 'user-001';

    // 実行
    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy,
      minimumFeasibilityThreshold,
      requestedBy,
    });

    // 検証：allocationPlans配列の存在と構造
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // 検証：各配置案のフィールド
    result.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(typeof plan.planId).toBe('string');
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.estimatedWorkHours).toBeDefined();
      expect(typeof plan.estimatedWorkHours).toBe('number');
      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.riskFactors).toBeDefined();
      expect(Array.isArray(plan.riskFactors)).toBe(true);
    });

    // 検証：allocatedWorkers配列の要素
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.workerId).toBeDefined();
        expect(typeof worker.workerId).toBe('string');
        expect(worker.assignedRole).toBeDefined();
        expect(typeof worker.assignedRole).toBe('string');
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(worker.estimatedProductivity).toBeDefined();
        expect(typeof worker.estimatedProductivity).toBe('number');
        expect(worker.proficiencyAdjustment).toBeDefined();
        expect(typeof worker.proficiencyAdjustment).toBe('number');
      });
    });

    // 検証：feasibilityScoreは0～100の範囲
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });

    // 検証：recommendedRanking配列の存在と構造
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.planId).toBeDefined();
      expect(typeof ranking.planId).toBe('string');
      expect(ranking.rank).toBeDefined();
      expect(typeof ranking.rank).toBe('number');
      expect(ranking.rank).toBeGreaterThan(0);
      expect(ranking.recommendationReason).toBeDefined();
      expect(typeof ranking.recommendationReason).toBe('string');
      expect(ranking.feasibilityScore).toBeDefined();
      expect(typeof ranking.feasibilityScore).toBe('number');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
    });

    // 検証：recommendedRankingがfeasibilityScoreの降順でソート
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      expect(result.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        result.recommendedRanking[i + 1].feasibilityScore
      );
    }

    // 検証：recommendedRanking内のすべての配置案のfeasibilityScoreがminimumFeasibilityThreshold以上
    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(minimumFeasibilityThreshold);
    });

    // 検証：rankフィールドが連番になっている
    result.recommendedRanking.forEach((ranking, index) => {
      expect(ranking.rank).toBe(index + 1);
    });

    // 検証：生成サマリーの存在と構造
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeDefined();
    expect(typeof result.generationSummary.totalPlansGenerated).toBe('number');
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(
      result.recommendedRanking.length
    );
    expect(result.generationSummary.plansAboveThreshold).toBeDefined();
    expect(typeof result.generationSummary.plansAboveThreshold).toBe('number');
    expect(result.generationSummary.plansAboveThreshold).toBe(
      result.recommendedRanking.length
    );
    expect(result.generationSummary.generationTimestamp).toBeDefined();
    expect(typeof result.generationSummary.generationTimestamp).toBe('string');
    // ISO 8601形式の確認
    expect(new Date(result.generationSummary.generationTimestamp).getTime()).toBeGreaterThan(0);
    expect(result.generationSummary.generationStrategy).toBe(generationStrategy);
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(
      true
    );
    expect(result.generationSummary.analysisDetails.productivityBottlenecks).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(
      true
    );
    expect(result.generationSummary.analysisDetails.recommendedInterventions).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(
      true
    );

    // 検証：readyForDeliveryがboolean型
    expect(result.readyForDelivery).toBeDefined();
    expect(typeof result.readyForDelivery).toBe('boolean');

    // 検証：readyForDeliveryの条件
    if (result.generationSummary.plansAboveThreshold >= 1) {
      expect(result.readyForDelivery).toBe(true);
    }

    // 検証：習熟度別の難度調整が適用されていることを確認
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((allocatedWorker) => {
        const sourceWorker = productivityData.find((w) => w.workerId === allocatedWorker.workerId);
        if (sourceWorker) {
          if (sourceWorker.proficiencyLevel === 'BEGINNER') {
            // BEGINNER：難度はEASYに下げられ、proficiencyAdjustmentは負値
            expect(allocatedWorker.difficultyLevel).toBe('EASY');
            expect(allocatedWorker.proficiencyAdjustment).toBeLessThan(0);
          } else if (sourceWorker.proficiencyLevel === 'INTERMEDIATE') {
            // INTERMEDIATE：難度はNORMAL、proficiencyAdjustmentはニュートラル
            expect(allocatedWorker.difficultyLevel).toBe('NORMAL');
            expect(allocatedWorker.proficiencyAdjustment).toBeLessThanOrEqual(0);
            expect(allocatedWorker.proficiencyAdjustment).toBeGreaterThanOrEqual(-0.1);
          } else if (sourceWorker.proficiencyLevel === 'ADVANCED') {
            // ADVANCED：難度はNORMALまたはHARD、proficiencyAdjustmentは小正値
            expect(['NORMAL', 'HARD']).toContain(allocatedWorker.difficultyLevel);
            expect(allocatedWorker.proficiencyAdjustment).toBeGreaterThan(0);
            expect(allocatedWorker.proficiencyAdjustment).toBeLessThanOrEqual(0.2);
          } else if (sourceWorker.proficiencyLevel === 'EXPERT') {
            // EXPERT：難度はHARD、proficiencyAdjustmentは大正値
            expect(allocatedWorker.difficultyLevel).toBe('HARD');
            expect(allocatedWorker.proficiencyAdjustment).toBeGreaterThan(0.2);
          }
        }
      });
    });

    // 検証：生産性データの習熟度レベル別に、難度調整ロジックが適用されている
    const recommendedPlan = result.allocationPlans.find((p) =>
      result.recommendedRanking.some((r) => r.planId === p.planId)
    );
    if (recommendedPlan && recommendedPlan.allocatedWorkers.length > 0) {
      // 高い生産性スコアの作業者がいることを確認
      const expertWorkers = recommendedPlan.allocatedWorkers.filter((w) => {
        const sourceWorker = productivityData.find((pd) => pd.workerId === w.workerId);
        return sourceWorker && sourceWorker.proficiencyLevel === 'EXPERT';
      });
      if (expertWorkers.length > 0) {
        expertWorkers.forEach((w) => {
          expect(w.difficultyLevel).toBe('HARD');
          expect(w.proficiencyAdjustment).toBeGreaterThan(0);
        });
      }
    }
  });
});