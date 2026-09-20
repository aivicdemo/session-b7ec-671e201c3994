import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import type {
  GenerateAllocationPlansInput,
  GenerateAllocationPlansOutput,
} from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-154: 生成された配置案の実現可能性スコアが最低基準以上のもののみがreadyForDeliveryをtrueで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('minimumFeasibilityThreshold以上のスコアを持つ配置案のみが allocationPlans に含まれ、readyForDelivery が true を返す', async () => {
    // テスト前提条件: 入力データを準備
    const minimumFeasibilityThreshold = 70;
    const targetFacilityIds = ['facility-001', 'facility-002'];
    const targetTeamIds = ['team-001', 'team-002', 'team-003'];
    const workInstructionIds = ['work-001', 'work-002', 'work-003'];

    // テスト前提条件: 遅延リスク判定結果（3件：HIGH, MEDIUM, LOW）
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 30,
        plannedProgressRate: 50,
        recommendedAction: 'Increase staffing',
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'work-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 60,
        plannedProgressRate: 70,
        recommendedAction: 'Monitor closely',
      },
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'work-003',
        facilityId: 'facility-001',
        teamId: 'team-003',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 0,
        currentProgressRate: 80,
        plannedProgressRate: 75,
        recommendedAction: 'Normal operation',
      },
    ];

    // テスト前提条件: 5名の作業者プロファイル（習熟度段階を含む）
    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.8,
        qualityScore: 85,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.7,
            errorCount: 2,
          },
        ],
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.9,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.8,
            errorCount: 1,
          },
        ],
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-002',
        teamId: 'team-002',
        productivityRate: 1.0,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-002',
            completionRate: 0.9,
            errorCount: 0,
          },
        ],
      },
      {
        workerId: 'worker-004',
        facilityId: 'facility-002',
        teamId: 'team-002',
        productivityRate: 1.1,
        qualityScore: 95,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-002',
            completionRate: 0.95,
            errorCount: 0,
          },
        ],
      },
      {
        workerId: 'worker-005',
        facilityId: 'facility-001',
        teamId: 'team-003',
        productivityRate: 0.85,
        qualityScore: 87,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-003',
            completionRate: 0.85,
            errorCount: 1,
          },
        ],
      },
    ];

    // テスト前提条件: generateAllocationPlans を呼び出し
    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold,
      requestedBy: 'user-001',
    };

    const result: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // 検証: allocationPlans に minimumFeasibilityThreshold 以上のスコアを持つ配置案のみが含まれる
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // 検証: すべての配置案のスコアが基準以上
    const allAboveThreshold = result.allocationPlans.every(
      (plan) => plan.feasibilityScore >= minimumFeasibilityThreshold
    );
    expect(allAboveThreshold).toBe(true);

    // 検証: スコア < 70 の配置案が除外されていることを確認
    const belowThresholdPlans = result.allocationPlans.filter(
      (plan) => plan.feasibilityScore < minimumFeasibilityThreshold
    );
    expect(belowThresholdPlans.length).toBe(0);

    // 検証: recommendedRanking に含まれるすべての計画が feasibilityScore >= 70
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);

    result.recommendedRanking.forEach((ranking) => {
      const correspondingPlan = result.allocationPlans.find((p) => p.planId === ranking.planId);
      expect(correspondingPlan).toBeDefined();
      expect(correspondingPlan!.feasibilityScore).toBeGreaterThanOrEqual(minimumFeasibilityThreshold);
    });

    // 検証: recommendedRanking は feasibilityScore の降順
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      const currentPlan = result.allocationPlans.find(
        (p) => p.planId === result.recommendedRanking[i].planId
      )!;
      const nextPlan = result.allocationPlans.find(
        (p) => p.planId === result.recommendedRanking[i + 1].planId
      )!;
      expect(currentPlan.feasibilityScore).toBeGreaterThanOrEqual(nextPlan.feasibilityScore);
    }

    // 検証: generationSummary.plansAboveThreshold は 3 を示す
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.plansAboveThreshold).toBe(3);
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(3);

    // 検証: readyForDelivery === true
    expect(result.readyForDelivery).toBe(true);

    // 追加検証: readyForDelivery が true の理由（すべての配置案が基準以上）
    const hasAnyBelowThreshold = result.allocationPlans.some(
      (plan) => plan.feasibilityScore < minimumFeasibilityThreshold
    );
    expect(hasAnyBelowThreshold).toBe(false);
  });

  it('複数の配置案が生成され、スコア別に正しくランキングされる', async () => {
    const minimumFeasibilityThreshold = 70;
    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Add resources',
      },
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.9,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 0,
          },
        ],
      },
    ];

    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold,
      requestedBy: 'user-001',
    };

    const result: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // 推奨ランキングが存在
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    // ランキングが rank の昇順
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      expect(result.recommendedRanking[i].rank).toBeLessThan(result.recommendedRanking[i + 1].rank);
    }

    // すべての配置案が基準以上
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(minimumFeasibilityThreshold);
    });

    // readyForDelivery が true
    expect(result.readyForDelivery).toBe(true);
  });

  it('生成概要に正しい統計情報が含まれる', async () => {
    const minimumFeasibilityThreshold = 70;
    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];

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
        recommendedAction: 'Reallocate staff',
      },
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 91,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.9,
            errorCount: 0,
          },
        ],
      },
    ];

    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold,
      requestedBy: 'user-001',
    };

    const result: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // 生成概要の検証
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(result.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      result.generationSummary.totalPlansGenerated
    );
    expect(result.generationSummary.generationTimestamp).toBeDefined();
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    // plansAboveThreshold === allocationPlans.length（すべてが基準以上）
    expect(result.generationSummary.plansAboveThreshold).toBe(result.allocationPlans.length);

    // readyForDelivery が true（すべての配置案が基準以上）
    expect(result.readyForDelivery).toBe(true);
  });
});