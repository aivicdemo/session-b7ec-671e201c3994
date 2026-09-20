import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-160: 推奨介入策が生成され、generationSummaryのrecommendedInterventionsに記録される', () => {
  it('should generate recommendedInterventions with specific staffing strategies based on delay risks and productivity data', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RISK-001',
          workInstructionId: 'WI-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-A',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 5,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: 'Add experienced staff to accelerate progress',
        },
        {
          riskJudgmentId: 'RISK-002',
          workInstructionId: 'WI-002',
          facilityId: 'FAC-001',
          teamId: 'TEAM-B',
          riskLevel: 'MEDIUM' as const,
          delayPredictionDays: 2,
          currentProgressRate: 60,
          plannedProgressRate: 75,
          recommendedAction: 'Optimize task priority and resource allocation',
        },
        {
          riskJudgmentId: 'RISK-003',
          workInstructionId: 'WI-003',
          facilityId: 'FAC-002',
          teamId: 'TEAM-C',
          riskLevel: 'LOW' as const,
          delayPredictionDays: 0,
          currentProgressRate: 85,
          plannedProgressRate: 85,
          recommendedAction: 'Monitor progress and maintain current staffing',
        },
      ],
      productivityData: [
        {
          workerId: 'WORKER-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-A',
          productivityRate: 0.95,
          qualityScore: 98,
          proficiencyLevel: 'EXPERT' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI-001',
              completionRate: 1.0,
              errorCount: 0,
            },
          ],
        },
        {
          workerId: 'WORKER-002',
          facilityId: 'FAC-001',
          teamId: 'TEAM-B',
          productivityRate: 0.75,
          qualityScore: 90,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI-002',
              completionRate: 0.8,
              errorCount: 2,
            },
          ],
        },
        {
          workerId: 'WORKER-003',
          facilityId: 'FAC-002',
          teamId: 'TEAM-C',
          productivityRate: 0.65,
          qualityScore: 85,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI-003',
              completionRate: 0.7,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'WORKER-004',
          facilityId: 'FAC-002',
          teamId: 'TEAM-A',
          productivityRate: 0.85,
          qualityScore: 92,
          proficiencyLevel: 'ADVANCED' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI-001',
              completionRate: 0.9,
              errorCount: 1,
            },
          ],
        },
      ],
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      targetTeamIds: ['TEAM-A', 'TEAM-B', 'TEAM-C'],
      workInstructionIds: ['WI-001', 'WI-002', 'WI-003'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER-001',
    };

    const result = await generateAllocationPlans(input);

    // 出力の型確認
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.generationSummary).toBeDefined();

    // generationSummaryの構造確認
    const { generationSummary } = result;
    expect(generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(generationSummary.generationTimestamp).toBeDefined();
    expect(generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');

    // analysisDetailsの確認
    expect(generationSummary.analysisDetails).toBeDefined();
    expect(Array.isArray(generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(
      true,
    );
    expect(
      generationSummary.analysisDetails.delayRiskFactorsIdentified.length,
    ).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(
      generationSummary.analysisDetails.productivityBottlenecks.length,
    ).toBeGreaterThanOrEqual(1);

    // recommendedInterventionsの確認（generationSummary.analysisDetails内）
    expect(Array.isArray(generationSummary.analysisDetails.recommendedInterventions)).toBe(true);
    expect(
      generationSummary.analysisDetails.recommendedInterventions.length,
    ).toBeGreaterThanOrEqual(1);

    // 各推奨介入策が文字列型であることを確認
    generationSummary.analysisDetails.recommendedInterventions.forEach((intervention) => {
      expect(typeof intervention).toBe('string');
      expect(intervention.length).toBeGreaterThan(0);
    });

    // 推奨介入策の内容がリスク判定と生産性データに基づいていることを確認
    const interventions = generationSummary.analysisDetails.recommendedInterventions;
    const delayFactors = generationSummary.analysisDetails.delayRiskFactorsIdentified;
    const productivityIssues = generationSummary.analysisDetails.productivityBottlenecks;

    // HIGH/MEDIUM/LOW別対応が具体的に含まれていることを確認
    // 入力データから：TEAM-A は HIGH リスク（進捗率45%＜70%）、EXPERT作業者（WORKER-001）が存在
    // 期待：進捗率が具体的に言及されるか、リスクレベルと拠点・チーム特定が含まれる施策
    const hasSpecificRiskInterventions = interventions.some((intervention) => {
      const mentionsProgressThreshold =
        intervention.includes('45%') ||
        intervention.includes('70%') ||
        (intervention.includes('進捗率') && (intervention.includes('未満') || intervention.includes('以下')));
      const mentionsRiskLevel =
        intervention.includes('HIGH') || intervention.includes('MEDIUM');
      const mentionsTeamOrFacility =
        intervention.includes('TEAM-A') ||
        intervention.includes('TEAM-B') ||
        intervention.includes('FAC-001');
      const mentionsIntervention =
        intervention.includes('追加配置') ||
        intervention.includes('優先配置') ||
        intervention.includes('配置') ||
        intervention.includes('対応');

      return (
        (mentionsProgressThreshold || mentionsRiskLevel) &&
        (mentionsTeamOrFacility || mentionsIntervention)
      );
    });
    expect(hasSpecificRiskInterventions).toBe(true);

    // 習熟度段階別の難度調整が具体的に含まれていることを確認
    // 入力データから：BEGINNER（WORKER-003）、INTERMEDIATE（WORKER-002）、ADVANCED（WORKER-004）、EXPERT（WORKER-001）
    // 期待：難度レベルの具体的なマッピング（例：BEGINNER→EASY）が施策に反映される
    const hasProficiencyAdjustmentIntervention = interventions.some((intervention) => {
      // 各習熟度レベルと対応する難度レベルのペアを検証
      const beginnerEasyMatch =
        intervention.includes('BEGINNER') &&
        (intervention.includes('EASY') || intervention.includes('容易'));
      const intermediateNormalMatch =
        intervention.includes('INTERMEDIATE') &&
        (intervention.includes('NORMAL') || intervention.includes('通常'));
      const advancedHardMatch =
        intervention.includes('ADVANCED') && intervention.includes('HARD');
      const expertHardMatch =
        intervention.includes('EXPERT') && intervention.includes('HARD');

      // もしくは、習熟度と難度の包括的なマッピングが記述されている
      const comprehensiveMapping =
        (intervention.includes('BEGINNER') ||
          intervention.includes('INTERMEDIATE') ||
          intervention.includes('ADVANCED') ||
          intervention.includes('EXPERT')) &&
        (intervention.includes('難度調整') ||
          (intervention.includes('難度') && intervention.includes('段階'))) &&
        (intervention.includes('EASY') ||
          intervention.includes('NORMAL') ||
          intervention.includes('HARD'));

      return (
        beginnerEasyMatch ||
        intermediateNormalMatch ||
        advancedHardMatch ||
        expertHardMatch ||
        comprehensiveMapping
      );
    });
    expect(hasProficiencyAdjustmentIntervention).toBe(true);

    // 各interventionがdelayFactorsまたはproductivityIssuesの分析結果に対応していることを確認
    // 仕様では意味的な整合性を要求（単なる文字列一致ではなく、分析内容の反映）
    interventions.forEach((intervention) => {
      // 遅延リスク関連の施策：HIGH/MEDIUM判定チームへの対応
      const addressesDelayRisk =
        (intervention.includes('HIGH') || intervention.includes('MEDIUM')) &&
        (intervention.includes('進捗') ||
          intervention.includes('遅延') ||
          intervention.includes('配置') ||
          intervention.includes('対応'));

      // 生産性ボトルネック関連の施策：習熟度別または生産性向上
      const addressesProductivityBottleneck =
        (intervention.includes('BEGINNER') ||
          intervention.includes('INTERMEDIATE') ||
          intervention.includes('生産性') ||
          intervention.includes('品質')) &&
        (intervention.includes('難度') ||
          intervention.includes('配置') ||
          intervention.includes('向上') ||
          intervention.includes('対応'));

      expect(addressesDelayRisk || addressesProductivityBottleneck).toBe(true);
    });

    // 少なくとも1つのdelayFactorが存在することを確認
    expect(delayFactors.length).toBeGreaterThanOrEqual(1);
    // 各delayFactorが文字列であることを確認
    delayFactors.forEach((factor) => {
      expect(typeof factor).toBe('string');
      expect(factor.length).toBeGreaterThan(0);
    });

    // 少なくとも1つのproductivityBottleneckが存在することを確認
    expect(productivityIssues.length).toBeGreaterThanOrEqual(1);
    // 各productivityBottleneckが文字列であることを確認
    productivityIssues.forEach((issue) => {
      expect(typeof issue).toBe('string');
      expect(issue.length).toBeGreaterThan(0);
    });

    // readyForDeliveryがtrueであることを確認
    expect(result.readyForDelivery).toBe(true);

    // allocationPlansが適切に生成されていることを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(plan.riskFactors)).toBe(true);

      // allocatedWorkersの構造確認
      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.workerId).toBeDefined();
        expect(worker.assignedRole).toBeDefined();
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(worker.estimatedProductivity).toBeGreaterThanOrEqual(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(1);
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });
    });

    // recommendedRankingが適切に生成されていることを確認
    expect(result.recommendedRanking.length).toBeGreaterThanOrEqual(1);
    result.recommendedRanking.forEach((ranking, index) => {
      expect(ranking.planId).toBeDefined();
      expect(ranking.rank).toBe(index + 1);
      expect(ranking.recommendationReason).toBeDefined();
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
    });
  });
});