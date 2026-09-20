import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-145: 生成戦略が指定されないとき、デフォルト値balance_risk_and_efficiencyで配置案が生成される', () => {
  it('should generate allocation plans with default strategy balance_risk_and_efficiency when generationStrategy is not specified', async () => {
    // ステップ1: テストデータを準備
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 50,
        plannedProgressRate: 70,
        recommendedAction: 'allocate additional staff',
      },
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.9,
        qualityScore: 85,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.95,
            errorCount: 2,
          },
        ],
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.7,
        qualityScore: 75,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 5,
          },
        ],
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.5,
        qualityScore: 65,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.60,
            errorCount: 10,
          },
        ],
      },
    ];

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    // ステップ2: 生成戦略と最小実現可能性スコア閾値を指定しない
    const generationStrategy = undefined;
    const minimumFeasibilityThreshold = undefined;

    // ステップ3: 入力データの形式を確認
    expect(delayRiskJudgments[0]).toHaveProperty('riskJudgmentId');
    expect(delayRiskJudgments[0]).toHaveProperty('workInstructionId');
    expect(delayRiskJudgments[0]).toHaveProperty('facilityId');
    expect(delayRiskJudgments[0]).toHaveProperty('teamId');
    expect(delayRiskJudgments[0]).toHaveProperty('riskLevel');
    expect(delayRiskJudgments[0]).toHaveProperty('delayPredictionDays');
    expect(delayRiskJudgments[0]).toHaveProperty('currentProgressRate');
    expect(delayRiskJudgments[0]).toHaveProperty('plannedProgressRate');
    expect(delayRiskJudgments[0]).toHaveProperty('recommendedAction');

    expect(productivityData[0]).toHaveProperty('workerId');
    expect(productivityData[0]).toHaveProperty('facilityId');
    expect(productivityData[0]).toHaveProperty('teamId');
    expect(productivityData[0]).toHaveProperty('productivityRate');
    expect(productivityData[0]).toHaveProperty('qualityScore');
    expect(productivityData[0]).toHaveProperty('proficiencyLevel');
    expect(productivityData[0]).toHaveProperty('recentWorkResults');

    // ステップ4: generateAllocationPlans処理を呼び出す
    const result = await generateAllocationPlans(
      {
        delayRiskJudgments,
        productivityData,
        targetFacilityIds,
        targetTeamIds,
        workInstructionIds,
        generationStrategy,
        minimumFeasibilityThreshold,
        requestedBy,
      }
    );

    // ステップ5: 処理が正常に完了
    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('recommendedRanking');
    expect(result).toHaveProperty('generationSummary');
    expect(result).toHaveProperty('readyForDelivery');

    // ステップ6: generationStrategyの値を確認
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');

    // ステップ7: 習熟度段階別の難度調整ロジックが正しく適用されていることを確認
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        // BEGINNERの場合、難度は調整される（通常より低い難度が割り当てられる）
        if (worker.proficiencyAdjustment === 0.5) {
          expect(['EASY', 'NORMAL']).toContain(worker.difficultyLevel);
          expect(worker.proficiencyAdjustment).toBe(0.5);
        }
        // INTERMEDIATEの場合
        else if (worker.proficiencyAdjustment === 0.8) {
          expect(['NORMAL', 'HARD']).toContain(worker.difficultyLevel);
          expect(worker.proficiencyAdjustment).toBe(0.8);
        }
        // ADVANCEDの場合
        else if (worker.proficiencyAdjustment === 1.0) {
          expect(['NORMAL', 'HARD']).toContain(worker.difficultyLevel);
          expect(worker.proficiencyAdjustment).toBe(1.0);
        }
        // EXPERTの場合
        else if (worker.proficiencyAdjustment === 1.2) {
          expect(['HARD']).toContain(worker.difficultyLevel);
          expect(worker.proficiencyAdjustment).toBe(1.2);
        }
      });
    });

    // ステップ8: recommendedRankingが実現可能性スコアの降順であることを確認
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      const currentPlan = result.allocationPlans.find(
        (p) => p.planId === result.recommendedRanking[i].planId
      );
      const nextPlan = result.allocationPlans.find(
        (p) => p.planId === result.recommendedRanking[i + 1].planId
      );
      expect(currentPlan?.feasibilityScore).toBeGreaterThanOrEqual(
        nextPlan?.feasibilityScore || 0
      );
    }

    // ステップ9: readyForDeliveryフィールドの値を確認
    // minimumFeasibilityThresholdが指定されない場合、デフォルト値60が適用される
    const allPlansAboveThreshold = result.allocationPlans.every(
      (plan) => plan.feasibilityScore >= 60
    );
    if (result.allocationPlans.length > 0) {
      expect(allPlansAboveThreshold).toBe(true);
      expect(result.readyForDelivery).toBe(true);
    }

    // 期待結果の検証
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    expect(result.recommendedRanking.length).toBe(result.allocationPlans.length);

    // minimumFeasibilityThresholdが指定されない場合、デフォルト値60が適用される確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
    });

    // readyForDeliveryが適切に設定されている
    expect(result.readyForDelivery).toBe(true);
  });
});