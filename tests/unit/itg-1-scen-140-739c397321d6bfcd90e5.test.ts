import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-140: 生産性データが空のとき InsufficientProductivityDataError が発生する', () => {
  it('should throw InsufficientProductivityDataError when productivityData is empty array', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RISK-001',
          workInstructionId: 'WI-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 0.6,
          plannedProgressRate: 0.8,
          recommendedAction: '人員追加',
        },
      ],
      productivityData: [],
      targetFacilityIds: ['FAC-001'],
      targetTeamIds: ['TEAM-001'],
      workInstructionIds: ['WI-001'],
      requestedBy: 'USER-001',
    };

    await expect(generateAllocationPlans(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InsufficientProductivityDataError',
        message: expect.stringContaining('生産性データが不足しています'),
      })
    );
  });

  it('should include the error message with guidance about productivity information', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RISK-001',
          workInstructionId: 'WI-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 0.6,
          plannedProgressRate: 0.8,
          recommendedAction: '人員追加',
        },
      ],
      productivityData: [],
      targetFacilityIds: ['FAC-001'],
      targetTeamIds: ['TEAM-001'],
      workInstructionIds: ['WI-001'],
      requestedBy: 'USER-001',
    };

    try {
      await generateAllocationPlans(input);
      fail('Should have thrown InsufficientProductivityDataError');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toContain('配置案生成に必要な作業者の生産性情報を確認してください');
      } else {
        throw error;
      }
    }
  });
});