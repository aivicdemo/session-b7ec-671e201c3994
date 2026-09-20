import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-164: generateAllocationPlans with incomplete new staff basic information', () => {
  it('should throw InsufficientProductivityDataError when productivity data is incomplete', async () => {
    const incompleteProductivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.75,
        qualityScore: 85,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'instruction-001',
            completionRate: 0.8,
            errorCount: 2
          }
        ]
        // age and career fields intentionally omitted to trigger validation error
      } as any
    ];

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'instruction-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 50,
        plannedProgressRate: 70,
        recommendedAction: 'Allocate additional staff'
      }
    ];

    const input = {
      delayRiskJudgments,
      productivityData: incompleteProductivityData,
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['instruction-001'],
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001'
    };

    try {
      await generateAllocationPlans(input);
      fail('Expected InsufficientProductivityDataError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.constructor.name).toBe('InsufficientProductivityDataError');
      expect(error.message).toBe(
        '生産性データが不足しています。配置案生成に必要な作業者の生産性情報を確認してください。'
      );
    }
  });
});