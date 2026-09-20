import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-177: 全体の納期遅延リスクが高・中・低で判定される', () => {
  it('should generate allocation plans with correct risk levels and ranking for HIGH/MEDIUM/LOW risks', async () => {
    // テストデータ: 進捗遅延リスク判定結果を準備
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'wi-001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 50,
        plannedProgressRate: 75,
        recommendedAction: '人員追加'
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'wi-002',
        facilityId: 'F001',
        teamId: 'T002',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 3,
        currentProgressRate: 70,
        plannedProgressRate: 75,
        recommendedAction: '優先度上げ'
      },
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'wi-003',
        facilityId: 'F002',
        teamId: 'T001',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 1,
        currentProgressRate: 85,
        plannedProgressRate: 90,
        recommendedAction: '継続監視'
      }
    ];

    // テストデータ: 作業者生産性データを準備
    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'F001',
        teamId: 'T001',
        productivityRate: 0.95,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          { workInstructionId: 'wi-001', completionRate: 0.95, errorCount: 0 }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'F001',
        teamId: 'T001',
        productivityRate: 0.90,
        qualityScore: 90,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          { workInstructionId: 'wi-001', completionRate: 0.85, errorCount: 1 }
        ]
      },
      {
        workerId: 'worker-003',
        facilityId: 'F001',
        teamId: 'T002',
        productivityRate: 0.85,
        qualityScore: 85,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          { workInstructionId: 'wi-002', completionRate: 0.60, errorCount: 3 }
        ]
      },
      {
        workerId: 'worker-004',
        facilityId: 'F002',
        teamId: 'T001',
        productivityRate: 0.92,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          { workInstructionId: 'wi-003', completionRate: 0.90, errorCount: 0 }
        ]
      },
      {
        workerId: 'worker-005',
        facilityId: 'F002',
        teamId: 'T002',
        productivityRate: 0.88,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          { workInstructionId: 'wi-003', completionRate: 0.80, errorCount: 2 }
        ]
      }
    ];

    // 入力パラメータを構築
    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['F001', 'F002'],
      targetTeamIds: ['T001', 'T002'],
      workInstructionIds: ['wi-001', 'wi-002', 'wi-003'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user001'
    };

    // generateAllocationPlans を実行
    const result = await generateAllocationPlans(input);

    // 基本的な構造検証
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.generationSummary).toBeDefined();
    expect(result.readyForDelivery).toBe(true);

    // recommendedRankingの全件について、riskLevelが HIGH/MEDIUM/LOW のいずれかであることを確認
    result.recommendedRanking.forEach((ranking) => {
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
    });

    // 推奨順位の第1位が HIGH リスクに対応していることを確認
    if (result.recommendedRanking.length > 0) {
      const rank1 = result.recommendedRanking[0];
      expect(rank1.riskLevel).toBe('HIGH');
      expect(rank1.rank).toBe(1);
    }

    // 推奨順位の第2位が MEDIUM リスクに対応していることを確認
    if (result.recommendedRanking.length > 1) {
      const rank2 = result.recommendedRanking[1];
      expect(rank2.riskLevel).toBe('MEDIUM');
      expect(rank2.rank).toBe(2);
    }

    // 推奨順位の第3位が LOW リスクに対応していることを確認
    if (result.recommendedRanking.length > 2) {
      const rank3 = result.recommendedRanking[2];
      expect(rank3.riskLevel).toBe('LOW');
      expect(rank3.rank).toBe(3);
    }

    // generationSummary の delayRiskFactorsIdentified に HIGH/MEDIUM/LOW が含まれていることを確認
    expect(result.generationSummary.delayRiskFactorsIdentified).toBeDefined();
    expect(Array.isArray(result.generationSummary.delayRiskFactorsIdentified)).toBe(true);
    const riskFactors = result.generationSummary.delayRiskFactorsIdentified.join('|');
    expect(riskFactors).toMatch(/HIGH/);
    expect(riskFactors).toMatch(/MEDIUM/);
    expect(riskFactors).toMatch(/LOW/);

    // allocationPlans の各案が最低基準以上の feasibilityScore を持つことを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(
        input.minimumFeasibilityThreshold
      );
    });

    // allocationPlans の各案が estimatedCompletionDate を持つことを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.estimatedCompletionDate).toBeDefined();
    });
  });
});