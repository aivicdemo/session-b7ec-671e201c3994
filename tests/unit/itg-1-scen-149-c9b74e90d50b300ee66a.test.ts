import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import type { GenerateAllocationPlansInput, GenerateAllocationPlansOutput } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-149: 習熟度段階別難度調整ロジックの適用検証', () => {
  it('BEGINNERにはEASY難度が、EXPERTにはHARD難度が割り当てられる', async () => {
    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'wi-100',
          facilityId: 'fac-A',
          teamId: 'team-1',
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 0.55,
          plannedProgressRate: 0.75,
          recommendedAction: '人員追加',
        },
      ],
      productivityData: [
        {
          workerId: 'w-101',
          facilityId: 'fac-A',
          teamId: 'team-1',
          productivityRate: 0.92,
          qualityScore: 0.95,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: 'wi-100',
              completionRate: 0.85,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: 'w-102',
          facilityId: 'fac-A',
          teamId: 'team-1',
          productivityRate: 0.88,
          qualityScore: 0.9,
          proficiencyLevel: 'EXPERT',
          recentWorkResults: [
            {
              workInstructionId: 'wi-100',
              completionRate: 0.95,
              errorCount: 0,
            },
          ],
        },
      ],
      targetFacilityIds: ['fac-A'],
      targetTeamIds: ['team-1'],
      workInstructionIds: ['wi-100'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-center-lead',
    };

    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // allocationPlans 配列が存在することを確認
    expect(output.allocationPlans).toBeDefined();
    expect(Array.isArray(output.allocationPlans)).toBe(true);
    expect(output.allocationPlans.length).toBeGreaterThan(0);

    // w-101 (BEGINNER) に対応する配置案を検索
    const beginnerPlan = output.allocationPlans.find((plan) =>
      plan.allocatedWorkers.some((worker) => worker.workerId === 'w-101')
    );
    expect(beginnerPlan).toBeDefined();
    const beginnerWorker = beginnerPlan!.allocatedWorkers.find(
      (w) => w.workerId === 'w-101'
    );
    expect(beginnerWorker).toBeDefined();
    expect(beginnerWorker!.difficultyLevel).toBe('EASY');

    // w-102 (EXPERT) に対応する配置案を検索
    const expertPlan = output.allocationPlans.find((plan) =>
      plan.allocatedWorkers.some((worker) => worker.workerId === 'w-102')
    );
    expect(expertPlan).toBeDefined();
    const expertWorker = expertPlan!.allocatedWorkers.find(
      (w) => w.workerId === 'w-102'
    );
    expect(expertWorker).toBeDefined();
    expect(expertWorker!.difficultyLevel).toBe('HARD');

    // 各配置案の feasibilityScore が minimumFeasibilityThreshold (60) 以上
    expect(beginnerPlan!.feasibilityScore).toBeGreaterThanOrEqual(60);
    expect(expertPlan!.feasibilityScore).toBeGreaterThanOrEqual(60);

    // recommendedRanking が存在することを確認
    expect(output.recommendedRanking).toBeDefined();
    expect(Array.isArray(output.recommendedRanking)).toBe(true);
    expect(output.recommendedRanking.length).toBeGreaterThan(0);

    // EXPERT 配置案 (feasibilityScore: 82) が BEGINNER 配置案 (feasibilityScore: 65) より前の順位
    const beginnerRanking = output.recommendedRanking.find(
      (r) => r.planId === beginnerPlan!.planId
    );
    const expertRanking = output.recommendedRanking.find(
      (r) => r.planId === expertPlan!.planId
    );

    expect(beginnerRanking).toBeDefined();
    expect(expertRanking).toBeDefined();
    expect(expertRanking!.rank).toBeLessThan(beginnerRanking!.rank);
    expect(expertRanking!.feasibilityScore).toBeGreaterThan(
      beginnerRanking!.feasibilityScore
    );

    // 各推奨案に recommendationReason が記載されていることを確認
    expect(beginnerRanking!.recommendationReason).toBeDefined();
    expect(beginnerRanking!.recommendationReason.length).toBeGreaterThan(0);
    expect(expertRanking!.recommendationReason).toBeDefined();
    expect(expertRanking!.recommendationReason.length).toBeGreaterThan(0);

    // 習熟度段階別難度調整の適用理由が記載されていることを確認
    expect(beginnerRanking!.recommendationReason).toContain('BEGINNER');
    expect(expertRanking!.recommendationReason).toContain('EXPERT');

    // generationSummary が存在することを確認
    expect(output.generationSummary).toBeDefined();
    expect(output.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(output.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(output.generationSummary.generationStrategy).toBe(
      'balance_risk_and_efficiency'
    );

    // readyForDelivery が true であることを確認
    expect(output.readyForDelivery).toBe(true);
  });
});