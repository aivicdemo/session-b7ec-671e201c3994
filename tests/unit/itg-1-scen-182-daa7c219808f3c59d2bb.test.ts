import { generateAllocationPlans, applyDifficultyAdjustmentByProficiency } from '../../src/logic/personnel-allocation-optimizer';
import * as personnelAllocationOptimizer from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-182: generateAllocationPlans with applyDifficultyAdjustmentByProficiency', () => {
  it('should generate allocation plans with proficiency-based difficulty adjustment applied', async () => {
    const applyDifficultySpy = jest.spyOn(personnelAllocationOptimizer, 'applyDifficultyAdjustmentByProficiency');

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-1',
        workInstructionId: 'work-1',
        facilityId: 'facility-1',
        teamId: 'team-1',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Allocate additional staff',
      },
      {
        riskJudgmentId: 'risk-2',
        workInstructionId: 'work-2',
        facilityId: 'facility-2',
        teamId: 'team-2',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 50,
        plannedProgressRate: 70,
        recommendedAction: 'Monitor closely',
      },
    ];

    const productivityData = [
      {
        workerId: 'worker-1',
        facilityId: 'facility-1',
        teamId: 'team-1',
        productivityRate: 0.8,
        qualityScore: 85,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-1',
            completionRate: 0.6,
            errorCount: 3,
          },
        ],
      },
      {
        workerId: 'worker-2',
        facilityId: 'facility-1',
        teamId: 'team-1',
        productivityRate: 0.9,
        qualityScore: 90,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-1',
            completionRate: 0.75,
            errorCount: 1,
          },
        ],
      },
      {
        workerId: 'worker-3',
        facilityId: 'facility-2',
        teamId: 'team-2',
        productivityRate: 0.95,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-2',
            completionRate: 0.85,
            errorCount: 0,
          },
        ],
      },
      {
        workerId: 'worker-4',
        facilityId: 'facility-2',
        teamId: 'team-2',
        productivityRate: 1.0,
        qualityScore: 98,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-2',
            completionRate: 0.95,
            errorCount: 0,
          },
        ],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['facility-1', 'facility-2'],
      targetTeamIds: ['team-1', 'team-2'],
      workInstructionIds: ['work-1', 'work-2'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    const result = await generateAllocationPlans(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach((plan) => {
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);

      plan.allocatedWorkers.forEach((worker) => {
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(typeof worker.proficiencyAdjustment).toBe('number');
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });
    });

    const beginnerWorkers = result.allocationPlans.flatMap((plan) =>
      plan.allocatedWorkers.filter(
        (w) =>
          productivityData.find((p) => p.workerId === w.workerId)
            ?.proficiencyLevel === 'BEGINNER'
      )
    );
    beginnerWorkers.forEach((worker) => {
      expect(['EASY', 'NORMAL']).toContain(worker.difficultyLevel);
      expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(0.7);
    });

    const expertWorkers = result.allocationPlans.flatMap((plan) =>
      plan.allocatedWorkers.filter(
        (w) =>
          productivityData.find((p) => p.workerId === w.workerId)
            ?.proficiencyLevel === 'EXPERT'
      )
    );
    expertWorkers.forEach((worker) => {
      expect(['NORMAL', 'HARD']).toContain(worker.difficultyLevel);
      expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.95);
    });

    const intermediateWorkers = result.allocationPlans.flatMap((plan) =>
      plan.allocatedWorkers.filter(
        (w) =>
          productivityData.find((p) => p.workerId === w.workerId)
            ?.proficiencyLevel === 'INTERMEDIATE'
      )
    );
    intermediateWorkers.forEach((worker) => {
      expect(worker.difficultyLevel).toBe('NORMAL');
      expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.8);
      expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(0.95);
    });

    const advancedWorkers = result.allocationPlans.flatMap((plan) =>
      plan.allocatedWorkers.filter(
        (w) =>
          productivityData.find((p) => p.workerId === w.workerId)
            ?.proficiencyLevel === 'ADVANCED'
      )
    );
    advancedWorkers.forEach((worker) => {
      expect(['NORMAL', 'HARD']).toContain(worker.difficultyLevel);
      expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.9);
    });

    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    result.recommendedRanking.forEach((ranking) => {
      const planExists = result.allocationPlans.some(
        (p) => p.planId === ranking.planId
      );
      expect(planExists).toBe(true);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
      expect(typeof ranking.feasibilityScore).toBe('number');
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);
    });

    expect(typeof result.readyForDelivery).toBe('boolean');

    expect(result.generationSummary).toBeDefined();
    expect(typeof result.generationSummary.totalPlansGenerated).toBe('number');
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(0);
    expect(typeof result.generationSummary.plansAboveThreshold).toBe('number');
    expect(result.generationSummary.generationStrategy).toBe(
      'balance_risk_and_efficiency'
    );

    expect(applyDifficultySpy).toHaveBeenCalled();
    expect(applyDifficultySpy.mock.calls.length).toBeGreaterThan(0);

    applyDifficultySpy.mock.calls.forEach((callArgs) => {
      const [input] = callArgs;
      expect(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).toContain(
        input.proficiencyLevel
      );
      expect(['EASY', 'NORMAL', 'HARD']).toContain(input.baseDifficultyLevel);
    });

    applyDifficultySpy.mock.results.forEach((result) => {
      if (result.type === 'return' && result.value) {
        const output = result.value;
        expect(['EASY', 'NORMAL', 'HARD']).toContain(output.adjustedDifficultyLevel);
        expect(typeof output.proficiencyAdjustmentFactor).toBe('number');
        expect(output.proficiencyAdjustmentFactor).toBeGreaterThanOrEqual(0.5);
        expect(output.proficiencyAdjustmentFactor).toBeLessThanOrEqual(1.2);
      }
    });

    applyDifficultySpy.mockRestore();
  });
});