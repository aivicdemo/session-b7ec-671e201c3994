import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-163: 新配属者の基本情報が年齢・経歴ともに完全に入力されたとき、初期割当案が複数生成される', () => {
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockCalculateAllocationFeasibilityScore: jest.Mock;
  let mockJudgeProficiencyLevel: jest.Mock;
  let mockApplyDifficultyAdjustmentByProficiency: jest.Mock;
  let mockGetActiveAllocationPlansByFacilityAndTeam: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetWorkerWithProficiencyAndProductivity = jest.fn(() => ({
      workerId: 'worker-new-001',
      age: 28,
      background: '物流業界3年',
      proficiencyLevel: 'BEGINNER',
    }));

    mockValidateReferentialIntegrity = jest.fn(() => ({
      isValid: true,
      errors: [],
    }));

    mockCalculateAllocationFeasibilityScore = jest.fn(() => 75);

    mockJudgeProficiencyLevel = jest.fn(() => 'BEGINNER');

    mockApplyDifficultyAdjustmentByProficiency = jest.fn(() => ({
      adjustedDifficultyLevel: 'EASY',
      proficiencyAdjustmentFactor: 0.5,
      adjustedProductivityRate: 0.5,
      feasibilityJudgment: true,
    }));

    mockGetActiveAllocationPlansByFacilityAndTeam = jest.fn(() => []);
  });

  it('新配属者の基本情報が完全に入力されたとき、複数の人員配置案が生成される', async () => {
    // Arrange: 新配属者の基本情報を準備
    const workerProductivityProfile = {
      workerId: 'worker-new-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      productivityRate: 0.6,
      qualityScore: 75,
      proficiencyLevel: 'BEGINNER' as const,
      recentWorkResults: [
        {
          workInstructionId: 'work-instr-001',
          completionRate: 0.45,
          errorCount: 2,
        },
        {
          workInstructionId: 'work-instr-002',
          completionRate: 0.55,
          errorCount: 1,
        },
      ],
    };

    // 進捗遅延リスク判定結果を準備
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-instr-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 45,
        plannedProgressRate: 70,
        recommendedAction: '人員追加配置が必要',
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'work-instr-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 45,
        plannedProgressRate: 70,
        recommendedAction: '人員追加配置が必要',
      },
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'work-instr-003',
        facilityId: 'facility-001',
        teamId: 'team-002',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 1,
        currentProgressRate: 55,
        plannedProgressRate: 70,
        recommendedAction: '進捗監視継続',
      },
    ];

    // 作業者生産性データを準備
    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-instr-001',
            completionRate: 0.95,
            errorCount: 0,
          },
        ],
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.7,
        qualityScore: 80,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-instr-002',
            completionRate: 0.75,
            errorCount: 1,
          },
        ],
      },
      {
        workerId: 'worker-new-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.6,
        qualityScore: 75,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-instr-001',
            completionRate: 0.45,
            errorCount: 2,
          },
        ],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001', 'team-002'],
      workInstructionIds: ['work-instr-001', 'work-instr-002', 'work-instr-003'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    // Act: generateAllocationPlansを呼び出し
    const result = await generateAllocationPlans(input);

    // Assert: 結果の検証
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThanOrEqual(3);

    // 各配置案の構成を検証
    result.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(typeof plan.planId).toBe('string');
      expect(plan.planId.length).toBeGreaterThan(0);

      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.planName.length).toBeGreaterThan(0);

      expect(input.targetFacilityIds).toContain(plan.facilityId);
      expect(input.targetTeamIds).toContain(plan.teamId);
      expect(input.workInstructionIds).toContain(plan.workInstructionId);

      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.allocatedWorkers.length).toBeGreaterThan(0);

      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.workerId).toBeDefined();
        expect(typeof worker.workerId).toBe('string');

        expect(worker.assignedRole).toBeDefined();
        expect(typeof worker.assignedRole).toBe('string');

        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);

        expect(typeof worker.estimatedProductivity).toBe('number');
        expect(worker.estimatedProductivity).toBeGreaterThanOrEqual(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(100);

        expect(typeof worker.proficiencyAdjustment).toBe('number');
      });

      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(typeof plan.estimatedCompletionDate).toBe('string');
      expect(() => new Date(plan.estimatedCompletionDate)).not.toThrow();

      expect(typeof plan.estimatedWorkHours).toBe('number');
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);

      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(
        input.minimumFeasibilityThreshold
      );

      expect(Array.isArray(plan.riskFactors)).toBe(true);
      plan.riskFactors.forEach((risk) => {
        expect(typeof risk).toBe('string');
      });
    });

    // recommendedRankingの検証
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBe(result.allocationPlans.length);

    const rankedPlanIds = result.recommendedRanking.map((r) => r.planId);
    const generatedPlanIds = result.allocationPlans.map((p) => p.planId);
    expect(rankedPlanIds.sort()).toEqual(generatedPlanIds.sort());

    result.recommendedRanking.forEach((ranking, index) => {
      expect(ranking.planId).toBeDefined();
      expect(typeof ranking.planId).toBe('string');

      expect(typeof ranking.rank).toBe('number');
      expect(ranking.rank).toBeGreaterThanOrEqual(1);
      expect(ranking.rank).toBeLessThanOrEqual(result.recommendedRanking.length);

      expect(ranking.recommendationReason).toBeDefined();
      expect(typeof ranking.recommendationReason).toBe('string');

      expect(typeof ranking.feasibilityScore).toBe('number');
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);

      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
    });

    // generationSummaryの検証
    expect(result.generationSummary).toBeDefined();

    expect(typeof result.generationSummary.totalPlansGenerated).toBe('number');
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(3);

    expect(typeof result.generationSummary.plansAboveThreshold).toBe('number');
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(result.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      result.generationSummary.totalPlansGenerated
    );

    expect(result.generationSummary.generationTimestamp).toBeDefined();
    expect(typeof result.generationSummary.generationTimestamp).toBe('string');
    expect(() =>
      new Date(result.generationSummary.generationTimestamp)
    ).not.toThrow();

    expect(result.generationSummary.generationStrategy).toBe(
      input.generationStrategy
    );

    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(
      true
    );
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(
      true
    );
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(
      true
    );

    expect(typeof result.readyForDelivery).toBe('boolean');
    expect(result.readyForDelivery).toBe(true);
  });
});