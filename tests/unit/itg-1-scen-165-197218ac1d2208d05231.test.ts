import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-165: 過去実績データが30日分未満のとき、警告が発生する', () => {
  it('should generate allocation plans with low confidence warning when historical data is less than 30 days', async () => {
    // Arrange: 過去実績データが29日分の状態を準備
    const recentWorkResults = Array.from({ length: 29 }, (_, index) => ({
      workInstructionId: `work-${String(index + 1).padStart(3, '0')}`,
      completionRate: 0.7 + Math.random() * 0.25,
      errorCount: Math.floor(Math.random() * 5),
    }));

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.85,
        qualityScore: 92,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults,
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.78,
        qualityScore: 88,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults,
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.90,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults,
      },
    ];

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 0.6,
        plannedProgressRate: 0.8,
        recommendedAction: 'Increase staffing',
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    // Act: generateAllocationPlans関数を呼び出す
    const result = await generateAllocationPlans(input);

    // Assert: 戻り値の検証
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.generationSummary).toBeDefined();

    // 警告メッセージの確認
    expect(result.generationSummary.analysisDetails).toBeDefined();
    const analysisDetails = result.generationSummary.analysisDetails;
    
    // 警告メッセージが記録されているか確認
    const hasLowDataWarning =
      analysisDetails.recommendedInterventions?.some(intervention =>
        intervention.includes('過去実績データが少ない') ||
        intervention.includes('推奨精度が低い')
      ) || false;
    
    expect(hasLowDataWarning).toBe(true);

    // readyForDelivery は false であること（精度が低いため）
    expect(result.readyForDelivery).toBe(false);

    // 配置案が空でないことを確認（推奨精度は低いが案は生成される）
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    // 各配置案が必須フィールドを持つことを確認
    result.allocationPlans.forEach(plan => {
      expect(plan.planId).toBeDefined();
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });

    // recommendedRankingが提案されていることを確認
    result.recommendedRanking.forEach(ranking => {
      expect(ranking.planId).toBeDefined();
      expect(ranking.rank).toBeDefined();
      expect(ranking.recommendationReason).toBeDefined();
      expect(ranking.feasibilityScore).toBeDefined();
    });

    // generationSummaryの検証
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      result.generationSummary.totalPlansGenerated
    );
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
  });
});