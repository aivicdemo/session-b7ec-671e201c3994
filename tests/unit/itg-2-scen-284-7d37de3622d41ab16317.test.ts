import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';
import * as personnelReallocationModule from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-284: workloadThreshold default value application', () => {
  it('should use default workloadThreshold value of 85 when not specified', async () => {
    // Arrange
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-A',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['wt-001', 'wt-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['site-B', 'site-C'],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      // workloadThreshold is intentionally not specified
    };

    // Stub validateInputData
    jest.spyOn(personnelReallocationModule, 'validateInputData' as any).mockReturnValue(true);

    // Stub calculateWorkloadAndCapacityBysite
    jest.spyOn(personnelReallocationModule, 'calculateWorkloadAndCapacityBysite' as any).mockImplementation(
      (siteId: string) => {
        if (siteId === 'site-B') {
          return {
            siteId: 'site-B',
            currentWorkload: 80,
            totalCapacityMinutes: 1000,
            usedCapacityMinutes: 800,
            availableCapacityMinutes: 200,
            activeWorkerCount: 4,
            totalWorkerCount: 5,
            averageProductivityRate: 85,
            dataQualityScore: 95,
            calculatedAt: '2024-01-15T10:00:00Z',
          };
        } else if (siteId === 'site-C') {
          return {
            siteId: 'site-C',
            currentWorkload: 75,
            totalCapacityMinutes: 1200,
            usedCapacityMinutes: 900,
            availableCapacityMinutes: 300,
            activeWorkerCount: 3,
            totalWorkerCount: 5,
            averageProductivityRate: 88,
            dataQualityScore: 92,
            calculatedAt: '2024-01-15T10:00:00Z',
          };
        }
      }
    );

    // Stub assessDeliveryMarginBySite
    jest.spyOn(personnelReallocationModule, 'assessDeliveryMarginBySite' as any).mockImplementation(
      (siteId: string) => {
        if (siteId === 'site-B') {
          return {
            siteId: 'site-B',
            deliveryDate: '2024-01-25T18:00:00Z',
            remainingDays: 10,
            remainingHours: 240,
            currentProgressRate: 60,
            requiredProgressRatePerDay: 4.5,
            deliveryMarginScore: 45,
            marginLevel: 'caution',
            assessedAt: '2024-01-15T10:00:00Z',
          };
        } else if (siteId === 'site-C') {
          return {
            siteId: 'site-C',
            deliveryDate: '2024-01-28T18:00:00Z',
            remainingDays: 13,
            remainingHours: 300,
            currentProgressRate: 55,
            requiredProgressRatePerDay: 3.46,
            deliveryMarginScore: 60,
            marginLevel: 'safe',
            assessedAt: '2024-01-15T10:00:00Z',
          };
        }
      }
    );

    // Stub evaluateSkillMatchDegree
    jest.spyOn(personnelReallocationModule, 'evaluateSkillMatchDegree' as any).mockImplementation(
      (sourceWorkerId: string, targetWorkTypeId: string) => {
        return {
          sourceWorkerId,
          targetWorkTypeId,
          matchDegree: 75,
          matchLevel: 'good',
          evaluationFactors: {
            jobTypeAlignment: 80,
            productivityAlignment: 75,
            difficultyAlignment: 70,
            experienceRelevance: 75,
          },
          matchingJustification: 'Worker has relevant experience',
          evaluatedAt: '2024-01-15T10:00:00Z',
        };
      }
    );

    // Stub identifyReallocatablePersonnelAndSources
    jest.spyOn(personnelReallocationModule, 'identifyReallocatablePersonnelAndSources' as any).mockReturnValue({
      reallocatableSources: [
        {
          siteId: 'site-B',
          availablePersonnelCount: 3,
          priorityScore: 85,
          workloadAfterReallocation: 84,
          deliveryMarginAfterReallocation: 240,
          recommendedWorkerIds: ['worker-b1', 'worker-b2', 'worker-b3'],
          skillMatchDegrees: {
            'wt-001': 75,
            'wt-002': 72,
          },
          riskFactors: [],
        },
        {
          siteId: 'site-C',
          availablePersonnelCount: 4,
          priorityScore: 88,
          workloadAfterReallocation: 81,
          deliveryMarginAfterReallocation: 300,
          recommendedWorkerIds: ['worker-c1', 'worker-c2', 'worker-c3', 'worker-c4'],
          skillMatchDegrees: {
            'wt-001': 78,
            'wt-002': 76,
          },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 7,
      isSufficientCapacity: true,
      identifiedAt: '2024-01-15T10:00:00Z',
    });

    // Act
    const result = await judgePersonnelReallocationFeasibility(input);

    // Assert - Feasibility judgment
    expect(result.feasibilityJudgment).toBeDefined();
    expect(result.feasibilityJudgment.isFeasible).toBe(true);

    // Assert - Workload after reallocation should be <= 85 (default threshold)
    expect(result.reallocatablePersonnelSummary).toBeDefined();
    expect(result.reallocatablePersonnelSummary.bySourceSite).toBeDefined();
    expect(result.reallocatablePersonnelSummary.bySourceSite.length).toBeGreaterThan(0);

    result.reallocatablePersonnelSummary.bySourceSite.forEach((source) => {
      expect(source.workloadAfterReallocation).toBeLessThanOrEqual(85);
    });

    // Assert - Recommended placement proposals should be generated
    expect(result.recommendedPlacementProposals).toBeDefined();
    expect(Array.isArray(result.recommendedPlacementProposals)).toBe(true);
    expect(result.recommendedPlacementProposals.length).toBeGreaterThan(0);

    // Assert - Total available personnel should meet requirement
    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBeGreaterThanOrEqual(
      input.requiredPersonnelCount
    );
  });
});