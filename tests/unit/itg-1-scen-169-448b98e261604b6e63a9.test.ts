import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-169: generateAllocationPlans - Error Handling for Invalid Input Data', () => {
  describe('Exception handling for invalid delay risk judgments and productivity data', () => {
    test('should throw InvalidDelayRiskJudgmentDataError when delayRiskJudgments is empty array', async () => {
      const input = {
        delayRiskJudgments: [],
        productivityData: [
          {
            workerId: 'W001',
            facilityId: 'F001',
            teamId: 'T001',
            productivityRate: 0.85,
            qualityScore: 0.9,
            proficiencyLevel: 'INTERMEDIATE' as const,
            recentWorkResults: [
              {
                workInstructionId: 'WI001',
                completionRate: 0.95,
                errorCount: 1,
              },
            ],
          },
        ],
        targetFacilityIds: ['F001'],
        targetTeamIds: ['T001'],
        workInstructionIds: ['WI001'],
        generationStrategy: 'balance_risk_and_efficiency' as const,
        minimumFeasibilityThreshold: 60,
        requestedBy: 'USER001',
      };

      await expect(generateAllocationPlans(input)).rejects.toMatchObject({
        name: 'InvalidDelayRiskJudgmentDataError',
        message: expect.stringContaining(
          '遅延リスク判定結果の形式が不正です。リスクレベル、進捗率、推奨対応が必須です。'
        ),
      });
    });

    test('should throw InsufficientProductivityDataError when targetTeamIds is empty and productivityData is empty', async () => {
      const input = {
        delayRiskJudgments: [
          {
            riskJudgmentId: 'RJ001',
            workInstructionId: 'WI001',
            facilityId: 'F001',
            teamId: 'T001',
            riskLevel: 'HIGH' as const,
            delayPredictionDays: 3,
            currentProgressRate: 0.45,
            plannedProgressRate: 0.7,
            recommendedAction: 'ADD_WORKERS',
          },
        ],
        productivityData: [],
        targetFacilityIds: ['F001'],
        targetTeamIds: [],
        workInstructionIds: ['WI001'],
        requestedBy: 'USER001',
      };

      await expect(generateAllocationPlans(input)).rejects.toMatchObject({
        name: 'InsufficientProductivityDataError',
        message: expect.stringContaining(
          '生産性データが不足しています。配置案生成に必要な作業者の生産性情報を確認してください。'
        ),
      });
    });

    test('should throw InvalidDelayRiskJudgmentDataError when currentProgressRate is negative', async () => {
      const input = {
        delayRiskJudgments: [
          {
            riskJudgmentId: 'RJ002',
            workInstructionId: 'WI002',
            facilityId: 'F001',
            teamId: 'T002',
            riskLevel: 'MEDIUM' as const,
            delayPredictionDays: 2,
            currentProgressRate: -0.1,
            plannedProgressRate: 0.8,
            recommendedAction: 'REORDER_PRIORITY',
          },
        ],
        productivityData: [
          {
            workerId: 'W002',
            facilityId: 'F001',
            teamId: 'T002',
            productivityRate: 0.75,
            qualityScore: 0.85,
            proficiencyLevel: 'BEGINNER' as const,
            recentWorkResults: [
              {
                workInstructionId: 'WI002',
                completionRate: 0.95,
                errorCount: 2,
              },
            ],
          },
        ],
        targetFacilityIds: ['F001'],
        targetTeamIds: ['T002'],
        workInstructionIds: ['WI002'],
        requestedBy: 'USER002',
      };

      await expect(generateAllocationPlans(input)).rejects.toMatchObject({
        name: 'InvalidDelayRiskJudgmentDataError',
        message: expect.stringContaining(
          '遅延リスク判定結果の形式が不正です。リスクレベル、進捗率、推奨対応が必須です。'
        ),
      });
    });

    test('should throw InvalidDelayRiskJudgmentDataError when completionRate is negative in productivityData', async () => {
      const input = {
        delayRiskJudgments: [
          {
            riskJudgmentId: 'RJ003',
            workInstructionId: 'WI003',
            facilityId: 'F001',
            teamId: 'T003',
            riskLevel: 'MEDIUM' as const,
            delayPredictionDays: 2,
            currentProgressRate: 0.5,
            plannedProgressRate: 0.8,
            recommendedAction: 'REORDER_PRIORITY',
          },
        ],
        productivityData: [
          {
            workerId: 'W003',
            facilityId: 'F001',
            teamId: 'T003',
            productivityRate: 0.75,
            qualityScore: 0.85,
            proficiencyLevel: 'BEGINNER' as const,
            recentWorkResults: [
              {
                workInstructionId: 'WI003',
                completionRate: -5,
                errorCount: 2,
              },
            ],
          },
        ],
        targetFacilityIds: ['F001'],
        targetTeamIds: ['T003'],
        workInstructionIds: ['WI003'],
        requestedBy: 'USER003',
      };

      await expect(generateAllocationPlans(input)).rejects.toMatchObject({
        name: 'InvalidDelayRiskJudgmentDataError',
        message: expect.stringContaining(
          '遅延リスク判定結果の形式が不正です。リスクレベル、進捗率、推奨対応が必須です。'
        ),
      });
    });

    test('should not return output when exception is thrown for empty delayRiskJudgments', async () => {
      const input = {
        delayRiskJudgments: [],
        productivityData: [
          {
            workerId: 'W001',
            facilityId: 'F001',
            teamId: 'T001',
            productivityRate: 0.85,
            qualityScore: 0.9,
            proficiencyLevel: 'INTERMEDIATE' as const,
            recentWorkResults: [
              {
                workInstructionId: 'WI001',
                completionRate: 0.95,
                errorCount: 1,
              },
            ],
          },
        ],
        targetFacilityIds: ['F001'],
        targetTeamIds: ['T001'],
        workInstructionIds: ['WI001'],
        generationStrategy: 'balance_risk_and_efficiency' as const,
        minimumFeasibilityThreshold: 60,
        requestedBy: 'USER001',
      };

      let result;
      try {
        result = await generateAllocationPlans(input);
      } catch {
        result = undefined;
      }

      expect(result).toBeUndefined();
    });

    test('should not return output when exception is thrown for empty productivityData and targetTeamIds', async () => {
      const input = {
        delayRiskJudgments: [
          {
            riskJudgmentId: 'RJ001',
            workInstructionId: 'WI001',
            facilityId: 'F001',
            teamId: 'T001',
            riskLevel: 'HIGH' as const,
            delayPredictionDays: 3,
            currentProgressRate: 0.45,
            plannedProgressRate: 0.7,
            recommendedAction: 'ADD_WORKERS',
          },
        ],
        productivityData: [],
        targetFacilityIds: ['F001'],
        targetTeamIds: [],
        workInstructionIds: ['WI001'],
        requestedBy: 'USER001',
      };

      let result;
      try {
        result = await generateAllocationPlans(input);
      } catch {
        result = undefined;
      }

      expect(result).toBeUndefined();
    });

    test('should not return output when exception is thrown for negative currentProgressRate', async () => {
      const input = {
        delayRiskJudgments: [
          {
            riskJudgmentId: 'RJ002',
            workInstructionId: 'WI002',
            facilityId: 'F001',
            teamId: 'T002',
            riskLevel: 'MEDIUM' as const,
            delayPredictionDays: 2,
            currentProgressRate: -0.1,
            plannedProgressRate: 0.8,
            recommendedAction: 'REORDER_PRIORITY',
          },
        ],
        productivityData: [
          {
            workerId: 'W002',
            facilityId: 'F001',
            teamId: 'T002',
            productivityRate: 0.75,
            qualityScore: 0.85,
            proficiencyLevel: 'BEGINNER' as const,
            recentWorkResults: [
              {
                workInstructionId: 'WI002',
                completionRate: 0.95,
                errorCount: 2,
              },
            ],
          },
        ],
        targetFacilityIds: ['F001'],
        targetTeamIds: ['T002'],
        workInstructionIds: ['WI002'],
        requestedBy: 'USER002',
      };

      let result;
      try {
        result = await generateAllocationPlans(input);
      } catch {
        result = undefined;
      }

      expect(result).toBeUndefined();
    });

    test('should not return output when exception is thrown for negative completionRate', async () => {
      const input = {
        delayRiskJudgments: [
          {
            riskJudgmentId: 'RJ003',
            workInstructionId: 'WI003',
            facilityId: 'F001',
            teamId: 'T003',
            riskLevel: 'MEDIUM' as const,
            delayPredictionDays: 2,
            currentProgressRate: 0.5,
            plannedProgressRate: 0.8,
            recommendedAction: 'REORDER_PRIORITY',
          },
        ],
        productivityData: [
          {
            workerId: 'W003',
            facilityId: 'F001',
            teamId: 'T003',
            productivityRate: 0.75,
            qualityScore: 0.85,
            proficiencyLevel: 'BEGINNER' as const,
            recentWorkResults: [
              {
                workInstructionId: 'WI003',
                completionRate: -5,
                errorCount: 2,
              },
            ],
          },
        ],
        targetFacilityIds: ['F001'],
        targetTeamIds: ['T003'],
        workInstructionIds: ['WI003'],
        requestedBy: 'USER003',
      };

      let result;
      try {
        result = await generateAllocationPlans(input);
      } catch {
        result = undefined;
      }

      expect(result).toBeUndefined();
    });
  });
});