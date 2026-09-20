import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  generateAllocationPlans,
  GenerateAllocationPlansInput,
  GenerateAllocationPlansOutput,
} from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-170: generateAllocationPlans - No available workers warning', () => {
  let input: GenerateAllocationPlansInput;

  beforeEach(() => {
    input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 30,
          plannedProgressRate: 60,
          recommendedAction: 'Add staff immediately',
        },
      ],
      productivityData: [],
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };
  });

  it('should return empty allocation plans and set readyForDelivery to false when no workers available', async () => {
    const result: GenerateAllocationPlansOutput =
      await generateAllocationPlans(input);

    expect(result.readyForDelivery).toBe(false);
    expect(result.allocationPlans).toEqual([]);
    expect(result.recommendedRanking).toEqual([]);
    expect(result.generationSummary.totalPlansGenerated).toBe(0);
    expect(result.generationSummary.plansAboveThreshold).toBe(0);
  });

  it('should include warning message about unavailable workers in generation summary', async () => {
    const result: GenerateAllocationPlansOutput =
      await generateAllocationPlans(input);

    const warningFound = result.generationSummary.analysisDetails.recommendedInterventions.some(
      (intervention) =>
        intervention.includes('配置可能な作業者がありません') ||
        intervention.includes('追加人員の確保を検討してください'),
    );

    expect(warningFound).toBe(true);
  });

  it('should not throw any design error when no workers available', async () => {
    await expect(generateAllocationPlans(input)).resolves.not.toThrow();
  });

  it('should generate timestamp and preserve strategy in summary', async () => {
    const result: GenerateAllocationPlansOutput =
      await generateAllocationPlans(input);

    expect(result.generationSummary.generationTimestamp).toBeDefined();
    expect(result.generationSummary.generationStrategy).toBe(
      'balance_risk_and_efficiency',
    );
  });

  it('should handle null productivityData as equivalent to empty array', async () => {
    const inputWithNullData = {
      ...input,
      productivityData: null as any,
    };

    const result: GenerateAllocationPlansOutput =
      await generateAllocationPlans(inputWithNullData);

    expect(result.readyForDelivery).toBe(false);
    expect(result.allocationPlans).toEqual([]);
  });

  it('should process multiple delay risk judgments but produce no plans', async () => {
    const multiRiskInput = {
      ...input,
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 30,
          plannedProgressRate: 60,
          recommendedAction: 'Add staff immediately',
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: 'work-002',
          facilityId: 'facility-002',
          teamId: 'team-002',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 1,
          currentProgressRate: 50,
          plannedProgressRate: 70,
          recommendedAction: 'Monitor closely',
        },
      ],
    };

    const result: GenerateAllocationPlansOutput =
      await generateAllocationPlans(multiRiskInput);

    expect(result.allocationPlans).toEqual([]);
    expect(result.readyForDelivery).toBe(false);
  });

  it('should not produce any recommended ranking when allocation plans are empty', async () => {
    const result: GenerateAllocationPlansOutput =
      await generateAllocationPlans(input);

    expect(result.recommendedRanking).toHaveLength(0);
    expect(
      result.recommendedRanking.every((rank) => rank.rank === undefined),
    ).toBe(true);
  });
});