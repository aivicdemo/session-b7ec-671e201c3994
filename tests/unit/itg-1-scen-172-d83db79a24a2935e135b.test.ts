import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-172: 進捗率がリスク閾値以下のチームが対応が必要なチームとして抽出される', () => {
  it('should generate allocation plans only for teams with progress rate below threshold', async () => {
    // テスト入力データを準備する
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-judgment-team-a',
        workInstructionId: 'work-instruction-1',
        facilityId: 'facility-1',
        teamId: 'team-a',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 55, // Team-A: 55% < 60% (threshold)
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
      {
        riskJudgmentId: 'risk-judgment-team-b',
        workInstructionId: 'work-instruction-2',
        facilityId: 'facility-1',
        teamId: 'team-b',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 0,
        currentProgressRate: 75, // Team-B: 75% >= 60% (threshold)
        plannedProgressRate: 75,
        recommendedAction: 'No action needed',
      },
    ];

    const productivityData = [
      {
        workerId: 'worker-1',
        facilityId: 'facility-1',
        teamId: 'team-a',
        productivityRate: 0.9,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-instruction-1',
            completionRate: 0.85,
            errorCount: 1,
          },
        ],
      },
      {
        workerId: 'worker-2',
        facilityId: 'facility-1',
        teamId: 'team-a',
        productivityRate: 0.75,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-instruction-1',
            completionRate: 0.70,
            errorCount: 2,
          },
        ],
      },
      {
        workerId: 'worker-3',
        facilityId: 'facility-1',
        teamId: 'team-b',
        productivityRate: 0.85,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-instruction-2',
            completionRate: 0.90,
            errorCount: 0,
          },
        ],
      },
    ];

    const targetFacilityIds = ['facility-1'];
    const targetTeamIds = ['team-a', 'team-b'];
    const workInstructionIds = ['work-instruction-1', 'work-instruction-2'];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-manager-1',
    };

    // generateAllocationPlans関数を呼び出す
    const result = await generateAllocationPlans(input);

    // 戻り値のallocationPlansを確認する
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // すべての配置案がTeam-Aに関連していることを確認
    const allocationPlansTeamIds = result.allocationPlans.map((plan) => plan.teamId);
    expect(allocationPlansTeamIds).toContain('team-a');

    // Team-Bに関連する配置案が存在しないことを確認
    const hasTeamB = allocationPlansTeamIds.some((teamId) => teamId === 'team-b');
    expect(hasTeamB).toBe(false);

    // 戻り値のrecommendedRankingを確認する
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    // recommendedRankingのすべてのplanIdがallocationPlansに含まれることを確認
    const allocationPlanIds = result.allocationPlans.map((plan) => plan.planId);
    result.recommendedRanking.forEach((ranking) => {
      expect(allocationPlanIds).toContain(ranking.planId);
    });

    // recommendedRankingのすべてのplanIdがTeam-Aに対応していることを確認
    result.recommendedRanking.forEach((ranking) => {
      const correspondingPlan = result.allocationPlans.find(
        (plan) => plan.planId === ranking.planId
      );
      expect(correspondingPlan).toBeDefined();
      expect(correspondingPlan?.teamId).toBe('team-a');
    });

    // readyForDeliveryフィールドがtrueであることを確認
    expect(result.readyForDelivery).toBe(true);

    // generationSummaryの分析結果を確認
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      result.generationSummary.totalPlansGenerated
    );
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');

    // 対応が必要なチームとしてTeam-Aが分析結果に含まれていることを確認
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);

    // Team-Aの遅延リスクが分析に含まれていることを確認
    const analysisDetails = result.generationSummary.analysisDetails.delayRiskFactorsIdentified.join(' ');
    expect(analysisDetails).toMatch(/team-a|Team-A|55|HIGH/i);
  });
});