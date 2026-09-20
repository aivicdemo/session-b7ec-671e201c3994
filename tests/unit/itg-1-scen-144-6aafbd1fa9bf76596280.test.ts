import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-144: AllocationPlanGenerationSystemError on database connection failure', () => {
  it('should throw AllocationPlanGenerationSystemError when database connection fails during allocation plan generation', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 50,
          plannedProgressRate: 70,
          recommendedAction: 'Add personnel to accelerate progress',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.85,
          qualityScore: 95,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.75,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.92,
          qualityScore: 98,
          proficiencyLevel: 'ADVANCED' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.88,
              errorCount: 0,
            },
          ],
        },
      ],
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    const databaseError = new Error('Database connection failed');
    (databaseError as any).code = 'ECONNREFUSED';

    const personnelAllocationOptimizer = require('../../src/logic/personnel-allocation-optimizer');

    jest
      .spyOn(personnelAllocationOptimizer, 'validateReferentialIntegrity')
      .mockResolvedValueOnce(undefined);

    jest
      .spyOn(personnelAllocationOptimizer, 'getWorkerWithProficiencyAndProductivity')
      .mockResolvedValueOnce({
        workerId: 'worker-001',
        proficiencyLevel: 'INTERMEDIATE',
        productivityRate: 0.85,
      })
      .mockResolvedValueOnce({
        workerId: 'worker-002',
        proficiencyLevel: 'ADVANCED',
        productivityRate: 0.92,
      });

    jest
      .spyOn(personnelAllocationOptimizer, 'judgeProficiencyLevel')
      .mockResolvedValueOnce('INTERMEDIATE')
      .mockResolvedValueOnce('ADVANCED');

    jest
      .spyOn(personnelAllocationOptimizer, 'applyDifficultyAdjustmentByProficiency')
      .mockResolvedValueOnce({
        workerId: 'worker-001',
        adjustedDifficultyLevel: 'NORMAL',
        proficiencyAdjustmentFactor: 0.8,
        adjustedProductivityRate: 0.68,
        feasibilityJudgment: true,
        adjustmentReason: 'INTERMEDIATE level adjusted for NORMAL difficulty',
        recommendedAlternativeIfNotFeasible: null,
      })
      .mockResolvedValueOnce({
        workerId: 'worker-002',
        adjustedDifficultyLevel: 'HARD',
        proficiencyAdjustmentFactor: 1.0,
        adjustedProductivityRate: 0.92,
        feasibilityJudgment: true,
        adjustmentReason: 'ADVANCED level can handle HARD difficulty',
        recommendedAlternativeIfNotFeasible: null,
      });

    jest
      .spyOn(personnelAllocationOptimizer, 'calculateAllocationFeasibilityScore')
      .mockResolvedValueOnce(75);

    jest
      .spyOn(personnelAllocationOptimizer, 'getActiveAllocationPlansByFacilityAndTeam')
      .mockRejectedValueOnce(databaseError);

    let caughtError: any;
    try {
      await generateAllocationPlans(input);
      fail('Expected AllocationPlanGenerationSystemError to be thrown');
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError.name).toBe('AllocationPlanGenerationSystemError');
    expect(caughtError.message).toBe(
      '配置案の生成処理中にシステムエラーが発生しました。管理者に報告してください。'
    );

    expect(caughtError.cause).toBe(databaseError);
    expect(caughtError.cause.code).toBe('ECONNREFUSED');

    expect(caughtError.stack).toContain('AllocationPlanGenerationSystemError');
    expect(caughtError.stack).toContain('Database connection failed');
    expect(caughtError.stack).toContain('ECONNREFUSED');

    expect(caughtError.cause instanceof Error).toBe(true);
    expect(caughtError.cause.message).toBe('Database connection failed');
  });
});