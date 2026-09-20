import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import { GenerateAllocationPlansInput, GenerateAllocationPlansOutput } from '../../src/logic/personnel-allocation-optimizer';
import * as jest from '@jest/globals';

describe('SCEN-148: 生成戦略がminimize_costのとき、コスト効率が最高の配置案が優先される', () => {
  let input: GenerateAllocationPlansInput;
  let output: GenerateAllocationPlansOutput;

  beforeEach(() => {
    // 手順1: テスト対象の入力データを準備する
    const facilityId1 = 'facility-001';
    const facilityId2 = 'facility-002';
    const teamId1 = 'team-001';
    const teamId2 = 'team-002';
    const teamId3 = 'team-003';
    const workInstructionId1 = 'work-001';
    const workInstructionId2 = 'work-002';
    const workInstructionId3 = 'work-003';

    input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: workInstructionId1,
          facilityId: facilityId1,
          teamId: teamId1,
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: 'Allocate additional resources',
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: workInstructionId2,
          facilityId: facilityId1,
          teamId: teamId2,
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: 'Allocate additional resources',
        },
        {
          riskJudgmentId: 'risk-003',
          workInstructionId: workInstructionId3,
          facilityId: facilityId2,
          teamId: teamId3,
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: 'Allocate additional resources',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: facilityId1,
          teamId: teamId1,
          productivityRate: 1.0,
          qualityScore: 90,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId1,
              completionRate: 95,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: facilityId1,
          teamId: teamId1,
          productivityRate: 0.8,
          qualityScore: 85,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId1,
              completionRate: 80,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'worker-003',
          facilityId: facilityId1,
          teamId: teamId2,
          productivityRate: 0.7,
          qualityScore: 75,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId2,
              completionRate: 60,
              errorCount: 5,
            },
          ],
        },
        {
          workerId: 'worker-004',
          facilityId: facilityId1,
          teamId: teamId2,
          productivityRate: 1.2,
          qualityScore: 95,
          proficiencyLevel: 'EXPERT',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId2,
              completionRate: 98,
              errorCount: 0,
            },
          ],
        },
        {
          workerId: 'worker-005',
          facilityId: facilityId2,
          teamId: teamId3,
          productivityRate: 0.9,
          qualityScore: 88,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId3,
              completionRate: 92,
              errorCount: 2,
            },
          ],
        },
        {
          workerId: 'worker-006',
          facilityId: facilityId2,
          teamId: teamId3,
          productivityRate: 0.5,
          qualityScore: 70,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId3,
              completionRate: 45,
              errorCount: 8,
            },
          ],
        },
        {
          workerId: 'worker-007',
          facilityId: facilityId2,
          teamId: teamId3,
          productivityRate: 1.1,
          qualityScore: 92,
          proficiencyLevel: 'EXPERT',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId3,
              completionRate: 96,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: 'worker-008',
          facilityId: facilityId1,
          teamId: teamId1,
          productivityRate: 0.6,
          qualityScore: 72,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId1,
              completionRate: 50,
              errorCount: 6,
            },
          ],
        },
      ],
      targetFacilityIds: [facilityId1, facilityId2],
      targetTeamIds: [teamId1, teamId2, teamId3],
      workInstructionIds: [workInstructionId1, workInstructionId2, workInstructionId3],
      generationStrategy: 'minimize_cost',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-requester-001',
    };
  });

  it('should generate allocation plans with minimize_cost strategy and rank highest cost-efficient plan as rank 1', async () => {
    // 手順3: generateAllocationPlans()を呼び出す
    output = await generateAllocationPlans(input);

    // 手順4: allocationPlans配列に複数の配置案が含まれていることを確認
    expect(output.allocationPlans).toBeDefined();
    expect(Array.isArray(output.allocationPlans)).toBe(true);
    expect(output.allocationPlans.length).toBeGreaterThanOrEqual(3);

    // 手順5: recommendedRankingの確認
    expect(output.recommendedRanking).toBeDefined();
    expect(Array.isArray(output.recommendedRanking)).toBe(true);
    expect(output.recommendedRanking.length).toBeGreaterThanOrEqual(2);

    // rank=1の配置案を取得
    const rank1Recommendation = output.recommendedRanking.find((r) => r.rank === 1);
    expect(rank1Recommendation).toBeDefined();
    expect(rank1Recommendation!.feasibilityScore).toBeGreaterThanOrEqual(60);

    const rank1Plan = output.allocationPlans.find((p) => p.planId === rank1Recommendation!.planId);
    expect(rank1Plan).toBeDefined();

    // ランク付けが降順であることを確認
    for (let i = 0; i < output.recommendedRanking.length - 1; i++) {
      expect(output.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        output.recommendedRanking[i + 1].feasibilityScore
      );
    }

    // 手順6: allocationPlansの各配置案を検証
    output.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(input.targetFacilityIds).toContain(plan.facilityId);
      expect(plan.teamId).toBeDefined();
      expect(input.targetTeamIds).toContain(plan.teamId);
      expect(plan.workInstructionId).toBeDefined();
      expect(input.workInstructionIds).toContain(plan.workInstructionId);

      // allocatedWorkers配列が2名以上含まれることを確認
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.allocatedWorkers.length).toBeGreaterThanOrEqual(2);

      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.workerId).toBeDefined();
        expect(worker.assignedRole).toBeDefined();
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(worker.estimatedProductivity).toBeGreaterThanOrEqual(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(100);
        expect(worker.proficiencyAdjustment).toBeDefined();
      });

      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(Array.isArray(plan.riskFactors)).toBe(true);
    });

    // 手順7: recommendedRankingの各要素を検証
    const rankedPlanIds = new Set<string>();
    output.recommendedRanking.forEach((ranking, index) => {
      expect(ranking.planId).toBeDefined();
      expect(ranking.rank).toBe(index + 1);
      expect(ranking.recommendationReason).toBeDefined();
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
      rankedPlanIds.add(ranking.planId);

      // rank=1のrecommendationReasonに具体的なコスト最適化根拠が記載されているかを検証
      if (ranking.rank === 1) {
        const reason = ranking.recommendationReason.toLowerCase();
        // コスト最適化の根拠が記載されているか確認
        expect(
          reason.includes('cost') ||
          reason.includes('efficient') ||
          reason.includes('minimize') ||
          reason.includes('productivity-to-cost') ||
          reason.includes('minimal')
        ).toBe(true);
      }
    });

    expect(rankedPlanIds.size).toBeGreaterThanOrEqual(2);

    // 手順8: generationSummaryを検証
    expect(output.generationSummary).toBeDefined();
    expect(output.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(3);
    expect(output.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(output.generationSummary.generationTimestamp).toBeDefined();
    expect(output.generationSummary.generationStrategy).toBe('minimize_cost');
    expect(Array.isArray(output.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(Array.isArray(output.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(Array.isArray(output.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    // 手順9: readyForDeliveryフラグを検証
    expect(output.readyForDelivery).toBe(true);

    // 手順10: rank=1の推奨配置案の総コストが他の配置案より低いことを確認
    const rank1Plan_verified = output.allocationPlans.find(
      (p) => p.planId === output.recommendedRanking.find((r) => r.rank === 1)!.planId
    );
    expect(rank1Plan_verified).toBeDefined();

    // コスト指標: allocatedWorkersの要素数が少ないほど低コスト（最小人数=最低コスト）
    const calculatePlanCost = (plan: typeof output.allocationPlans[0]) => {
      return plan.allocatedWorkers.length;
    };

    const rank1Cost = calculatePlanCost(rank1Plan_verified!);

    // rank=1の配置案のコストが他のすべての配置案以下であることを検証
    output.allocationPlans.forEach((plan) => {
      const planCost = calculatePlanCost(plan);
      expect(rank1Cost).toBeLessThanOrEqual(planCost);
    });

    // 他のランク付けされた配置案とも比較
    output.recommendedRanking.slice(1).forEach((ranking) => {
      const otherPlan = output.allocationPlans.find((p) => p.planId === ranking.planId);
      if (otherPlan) {
        const otherCost = calculatePlanCost(otherPlan);
        // rank=1の配置案のコストが最も低い（最小要素数）であることを検証
        expect(rank1Cost).toBeLessThanOrEqual(otherCost);
      }
    });

    // 生産性対コスト比を検証: rank=1の配置案が生産性対コスト比で優れていることを確認
    const calculateProductivityToCostRatio = (plan: typeof output.allocationPlans[0]) => {
      const totalProductivity = plan.allocatedWorkers.reduce(
        (sum, worker) => sum + worker.estimatedProductivity,
        0
      );
      const totalCost = calculatePlanCost(plan);
      return totalProductivity / totalCost;
    };

    const rank1Ratio = calculateProductivityToCostRatio(rank1Plan_verified!);
    output.recommendedRanking.slice(1).forEach((ranking) => {
      const otherPlan = output.allocationPlans.find((p) => p.planId === ranking.planId);
      if (otherPlan) {
        const otherRatio = calculateProductivityToCostRatio(otherPlan);
        // rank=1の配置案の生産性対コスト比が最も高いことを検証
        expect(rank1Ratio).toBeGreaterThanOrEqual(otherRatio);
      }
    });

    // generationStrategy='minimize_cost'により、コスト効率が最高の配置案がrank=1に配置されることを最終確認
    expect(output.generationSummary.generationStrategy).toBe('minimize_cost');
    expect(rank1Recommendation!.rank).toBe(1);
  });
});