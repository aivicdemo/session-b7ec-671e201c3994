import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import * as personnelModule from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-141: NoViableAllocationPlanError発生時の動作', () => {
  it('実現可能性スコアが最低基準を満たす配置案が1件も生成できないとき、NoViableAllocationPlanErrorが発生する', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'wi-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 30,
          plannedProgressRate: 50,
          recommendedAction: 'Add 2 workers',
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: 'wi-002',
          facilityId: 'facility-002',
          teamId: 'team-002',
          riskLevel: 'MEDIUM' as const,
          delayPredictionDays: 1,
          currentProgressRate: 40,
          plannedProgressRate: 60,
          recommendedAction: 'Reallocate 1 worker',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.85,
          qualityScore: 90,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'wi-001',
              completionRate: 0.75,
              errorCount: 2,
            },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: 'facility-002',
          teamId: 'team-002',
          productivityRate: 0.70,
          qualityScore: 85,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'wi-002',
              completionRate: 0.60,
              errorCount: 5,
            },
          ],
        },
      ],
      targetFacilityIds: ['facility-001', 'facility-002'],
      targetTeamIds: ['team-001', 'team-002'],
      workInstructionIds: ['wi-001', 'wi-002'],
      minimumFeasibilityThreshold: 80,
      generationStrategy: 'balance_risk_and_efficiency' as const,
      requestedBy: 'user-001',
    };

    const validateReferentialIntegritySpy = jest
      .spyOn(personnelModule as any, 'validateReferentialIntegrity')
      .mockResolvedValue(undefined);

    const calculateAllocationFeasibilityScoreSpy = jest
      .spyOn(personnelModule as any, 'calculateAllocationFeasibilityScore')
      .mockResolvedValue({
        feasibilityScore: 75,
      });

    const judgeProficiencyLevelSpy = jest
      .spyOn(personnelModule as any, 'judgeProficiencyLevel')
      .mockResolvedValue({
        workerId: 'worker-001',
        proficiencyLevel: 'INTERMEDIATE',
      });

    const applyDifficultyAdjustmentByProficiencySpy = jest
      .spyOn(personnelModule as any, 'applyDifficultyAdjustmentByProficiency')
      .mockResolvedValue({
        workerId: 'worker-001',
        adjustedDifficultyLevel: 'NORMAL',
        proficiencyAdjustmentFactor: 0.8,
        adjustedProductivityRate: 0.68,
        feasibilityJudgment: true,
        adjustmentReason: 'INTERMEDIATE のため HARD から NORMAL に調整',
      });

    const getWorkerWithProficiencyAndProductivitySpy = jest
      .spyOn(personnelModule as any, 'getWorkerWithProficiencyAndProductivity')
      .mockResolvedValue({
        workerId: 'worker-001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'INTERMEDIATE',
      });

    const getActiveAllocationPlansByFacilityAndTeamSpy = jest
      .spyOn(personnelModule as any, 'getActiveAllocationPlansByFacilityAndTeam')
      .mockResolvedValue([]);

    try {
      const result = await generateAllocationPlans(input);

      expect(result.allocationPlans).toEqual([]);
      expect(result.recommendedRanking).toEqual([]);
      expect(result.readyForDelivery).toBe(false);

      fail('NoViableAllocationPlanError should have been thrown');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.name).toBe('NoViableAllocationPlanError');
        expect(error.message).toBe(
          '現在の人員配置と生産性では、納期内に対応可能な配置案を生成できません。人員追加またはスケジュール調整が必要です。',
        );
      }
    } finally {
      validateReferentialIntegritySpy.mockRestore();
      calculateAllocationFeasibilityScoreSpy.mockRestore();
      judgeProficiencyLevelSpy.mockRestore();
      applyDifficultyAdjustmentByProficiencySpy.mockRestore();
      getWorkerWithProficiencyAndProductivitySpy.mockRestore();
      getActiveAllocationPlansByFacilityAndTeamSpy.mockRestore();
    }
  });
});