import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-139: 遅延リスク判定結果が必須フィールド欠落で不正な形式のとき、InvalidDelayRiskJudgmentDataErrorが発生する', () => {
  it('必須フィールド（currentProgressRate）が欠落した遅延リスク判定結果を入力すると、InvalidDelayRiskJudgmentDataErrorが発生する', async () => {
    const invalidInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          recommendedAction: 'Increase staffing',
          // currentProgressRate と plannedProgressRate が欠落
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          productivityRate: 0.85,
          qualityScore: 90,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.75,
              errorCount: 2,
            },
          ],
        },
      ],
      targetFacilityIds: ['fac-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      requestedBy: 'user-001',
    };

    await expect(generateAllocationPlans(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDelayRiskJudgmentDataError',
        message: expect.stringContaining(
          '遅延リスク判定結果の形式が不正です。リスクレベル、進捗率、推奨対応が必須です。'
        ),
      })
    );
  });

  it('必須フィールド（plannedProgressRate）が欠落した遅延リスク判定結果を入力すると、InvalidDelayRiskJudgmentDataErrorが発生する', async () => {
    const invalidInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 0.65,
          recommendedAction: 'Increase staffing',
          // plannedProgressRate が欠落
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          productivityRate: 0.85,
          qualityScore: 90,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.75,
              errorCount: 2,
            },
          ],
        },
      ],
      targetFacilityIds: ['fac-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      requestedBy: 'user-001',
    };

    await expect(generateAllocationPlans(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDelayRiskJudgmentDataError',
        message: expect.stringContaining(
          '遅延リスク判定結果の形式が不正です。リスクレベル、進捗率、推奨対応が必須です。'
        ),
      })
    );
  });

  it('必須フィールド（riskLevel）が欠落した遅延リスク判定結果を入力すると、InvalidDelayRiskJudgmentDataErrorが発生する', async () => {
    const invalidInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          delayPredictionDays: 2,
          currentProgressRate: 0.65,
          plannedProgressRate: 0.8,
          recommendedAction: 'Increase staffing',
          // riskLevel が欠落
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          productivityRate: 0.85,
          qualityScore: 90,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.75,
              errorCount: 2,
            },
          ],
        },
      ],
      targetFacilityIds: ['fac-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      requestedBy: 'user-001',
    };

    await expect(generateAllocationPlans(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDelayRiskJudgmentDataError',
        message: expect.stringContaining(
          '遅延リスク判定結果の形式が不正です。リスクレベル、進捗率、推奨対応が必須です。'
        ),
      })
    );
  });

  it('複数の必須フィールドが欠落した遅延リスク判定結果を入力すると、InvalidDelayRiskJudgmentDataErrorが発生する', async () => {
    const invalidInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          delayPredictionDays: 2,
          // riskLevel, currentProgressRate, plannedProgressRate, recommendedAction が欠落
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          productivityRate: 0.85,
          qualityScore: 90,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.75,
              errorCount: 2,
            },
          ],
        },
      ],
      targetFacilityIds: ['fac-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      requestedBy: 'user-001',
    };

    await expect(generateAllocationPlans(invalidInput as any)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDelayRiskJudgmentDataError',
        message: expect.stringContaining(
          '遅延リスク判定結果の形式が不正です。リスクレベル、進捗率、推奨対応が必須です。'
        ),
      })
    );
  });
});