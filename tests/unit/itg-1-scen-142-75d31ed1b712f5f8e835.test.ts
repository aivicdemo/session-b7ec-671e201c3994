import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-142: ProficiencyLevelMappingError when proficiency level is out of range', () => {
  it('should throw ProficiencyLevelMappingError when proficiencyLevel is invalid', async () => {
    const invalidProductivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.8,
        qualityScore: 95,
        proficiencyLevel: 'UNKNOWN' as any,
        recentWorkResults: [
          {
            workInstructionId: 'instr-001',
            completionRate: 0.85,
            errorCount: 2,
          },
        ],
      },
    ];

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'instr-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 50,
        plannedProgressRate: 65,
        recommendedAction: 'Add personnel',
      },
    ];

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['instr-001'];
    const requestedBy = 'user-001';

    await expect(
      generateAllocationPlans({
        delayRiskJudgments,
        productivityData: invalidProductivityData,
        targetFacilityIds,
        targetTeamIds,
        workInstructionIds,
        generationStrategy: 'balance_risk_and_efficiency',
        minimumFeasibilityThreshold: 60,
        requestedBy,
      })
    ).rejects.toThrow('ProficiencyLevelMappingError');
  });

  it('should throw ProficiencyLevelMappingError when proficiencyLevel is null', async () => {
    const invalidProductivityData = [
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.75,
        qualityScore: 90,
        proficiencyLevel: null as any,
        recentWorkResults: [
          {
            workInstructionId: 'instr-002',
            completionRate: 0.8,
            errorCount: 1,
          },
        ],
      },
    ];

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'instr-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Urgent action required',
      },
    ];

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['instr-002'];
    const requestedBy = 'user-002';

    await expect(
      generateAllocationPlans({
        delayRiskJudgments,
        productivityData: invalidProductivityData,
        targetFacilityIds,
        targetTeamIds,
        workInstructionIds,
        generationStrategy: 'balance_risk_and_efficiency',
        minimumFeasibilityThreshold: 60,
        requestedBy,
      })
    ).rejects.toThrow('ProficiencyLevelMappingError');
  });

  it('should throw ProficiencyLevelMappingError with specific message when proficiencyLevel mapping not found', async () => {
    const invalidProductivityData = [
      {
        workerId: 'worker-003',
        facilityId: 'facility-002',
        teamId: 'team-002',
        productivityRate: 0.9,
        qualityScore: 98,
        proficiencyLevel: 'INVALID' as any,
        recentWorkResults: [
          {
            workInstructionId: 'instr-003',
            completionRate: 0.95,
            errorCount: 0,
          },
        ],
      },
    ];

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'instr-003',
        facilityId: 'facility-002',
        teamId: 'team-002',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 1,
        currentProgressRate: 70,
        plannedProgressRate: 72,
        recommendedAction: 'Monitor',
      },
    ];

    const targetFacilityIds = ['facility-002'];
    const targetTeamIds = ['team-002'];
    const workInstructionIds = ['instr-003'];
    const requestedBy = 'user-003';

    try {
      await generateAllocationPlans({
        delayRiskJudgments,
        productivityData: invalidProductivityData,
        targetFacilityIds,
        targetTeamIds,
        workInstructionIds,
        generationStrategy: 'balance_risk_and_efficiency',
        minimumFeasibilityThreshold: 60,
        requestedBy,
      });
      fail('Expected ProficiencyLevelMappingError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('ProficiencyLevelMappingError');
      expect(error.message).toContain(
        '作業者の習熟度レベルに対応する難度調整ロジックが見つかりません'
      );
      expect(error.message).toContain('習熟度マスタを確認してください');
    }
  });
});