import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-171: リスク閾値が0未満または100を超えるとき、自動的に0～100の範囲に調整される', () => {
  const baseInput = {
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
        recommendedAction: 'Increase staffing',
      },
    ],
    productivityData: [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.85,
        qualityScore: 92,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.8,
            errorCount: 2,
          },
        ],
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.9,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.95,
            errorCount: 0,
          },
        ],
      },
    ],
    targetFacilityIds: ['facility-001'],
    targetTeamIds: ['team-001'],
    workInstructionIds: ['work-001'],
    generationStrategy: 'balance_risk_and_efficiency' as const,
    requestedBy: 'user-001',
  };

  it('should adjust minimumFeasibilityThreshold from -10 to 0 and generate valid allocation plans', async () => {
    const inputWithNegativeThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: -10,
    };

    const result = await generateAllocationPlans(inputWithNegativeThreshold);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });

    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    expect(result.generationSummary.analysisDetails).toBeDefined();
  });

  it('should adjust minimumFeasibilityThreshold from 150 to 100 and generate valid allocation plans', async () => {
    const inputWithExcessiveThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 150,
    };

    const result = await generateAllocationPlans(inputWithExcessiveThreshold);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });

    expect(result.generationSummary).toBeDefined();
  });

  it('should generate equivalent allocation plans when threshold -10 is normalized to 0', async () => {
    const inputWithNegativeThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: -10,
    };

    const inputWithZeroThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 0,
    };

    const resultNegative = await generateAllocationPlans(inputWithNegativeThreshold);
    const resultZero = await generateAllocationPlans(inputWithZeroThreshold);

    expect(resultNegative.allocationPlans.length).toBe(resultZero.allocationPlans.length);
    expect(resultNegative.allocationPlans).toEqual(resultZero.allocationPlans);
  });

  it('should generate equivalent allocation plans when threshold 150 is normalized to 100', async () => {
    const inputWithExcessiveThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 150,
    };

    const inputWithMaxThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 100,
    };

    const resultExcessive = await generateAllocationPlans(inputWithExcessiveThreshold);
    const resultMax = await generateAllocationPlans(inputWithMaxThreshold);

    expect(resultExcessive.allocationPlans.length).toBe(resultMax.allocationPlans.length);
    expect(resultExcessive.allocationPlans).toEqual(resultMax.allocationPlans);
  });

  it('should generate equivalent allocation plans when -10 is normalized and compared with normal value 60', async () => {
    const inputWithNegativeThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: -10,
    };

    const inputWithNormalThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 60,
    };

    const resultNegative = await generateAllocationPlans(inputWithNegativeThreshold);
    const resultNormal = await generateAllocationPlans(inputWithNormalThreshold);

    // -10 should be adjusted to 0, which is different from 60
    // Both should generate valid plans, but they may differ
    expect(resultNegative.allocationPlans.length).toBeGreaterThan(0);
    expect(resultNormal.allocationPlans.length).toBeGreaterThan(0);

    resultNegative.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });

    resultNormal.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });
  });

  it('should ensure all feasibility scores are within valid range after threshold adjustment', async () => {
    const thresholdValues = [-10, 0, 60, 100, 150];

    for (const threshold of thresholdValues) {
      const input = {
        ...baseInput,
        minimumFeasibilityThreshold: threshold,
      };

      const result = await generateAllocationPlans(input);

      result.allocationPlans.forEach((plan) => {
        expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
        expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      });
    }
  });

  it('should return readyForDelivery as true when allocation plans are generated successfully', async () => {
    const inputWithNegativeThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: -10,
    };

    const result = await generateAllocationPlans(inputWithNegativeThreshold);

    expect(result.readyForDelivery).toBe(true);
  });

  it('should populate recommendedRanking with feasibility scores in valid range', async () => {
    const inputWithExcessiveThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 150,
    };

    const result = await generateAllocationPlans(inputWithExcessiveThreshold);

    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);

    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);
    });
  });

  it('should handle boundary value 0 for minimumFeasibilityThreshold', async () => {
    const inputWithZeroThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 0,
    };

    const result = await generateAllocationPlans(inputWithZeroThreshold);

    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });
  });

  it('should handle boundary value 100 for minimumFeasibilityThreshold', async () => {
    const inputWithMaxThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 100,
    };

    const result = await generateAllocationPlans(inputWithMaxThreshold);

    expect(result.allocationPlans).toBeDefined();
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });
  });

  it('should include adjustment metadata in generationSummary when threshold is below 0', async () => {
    const inputWithNegativeThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: -10,
    };

    const result = await generateAllocationPlans(inputWithNegativeThreshold);

    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.analysisDetails).toBeDefined();

    const hasAdjustmentInfo =
      result.generationSummary.analysisDetails.recommendedInterventions?.some(
        (intervention) =>
          intervention.includes('閾値') ||
          intervention.includes('調整') ||
          intervention.includes('0～100') ||
          intervention.includes('threshold')
      ) ||
      JSON.stringify(result.generationSummary).includes('調整') ||
      JSON.stringify(result.generationSummary).includes('0～100');

    expect(hasAdjustmentInfo).toBe(true);
  });

  it('should include adjustment metadata in generationSummary when threshold exceeds 100', async () => {
    const inputWithExcessiveThreshold = {
      ...baseInput,
      minimumFeasibilityThreshold: 150,
    };

    const result = await generateAllocationPlans(inputWithExcessiveThreshold);

    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.analysisDetails).toBeDefined();

    const hasAdjustmentInfo =
      result.generationSummary.analysisDetails.recommendedInterventions?.some(
        (intervention) =>
          intervention.includes('閾値') ||
          intervention.includes('調整') ||
          intervention.includes('0～100') ||
          intervention.includes('threshold')
      ) ||
      JSON.stringify(result.generationSummary).includes('調整') ||
      JSON.stringify(result.generationSummary).includes('0～100');

    expect(hasAdjustmentInfo).toBe(true);
  });
});