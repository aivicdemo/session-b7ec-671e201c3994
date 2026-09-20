import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';
import * as personnelReallocationModule from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-270: SkillMismatchError when all skill match degrees are below threshold', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SkillMismatchError when skill match degree is below 50% for all target work types', async () => {
    // Prepare test input data
    const currentTime = new Date().toISOString();
    const analysisDateString = new Date().toISOString().split('T')[0];
    
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-A',
        delayRiskScore: 75,
        detectedAt: currentTime,
        requiredAdjustments: ['人員追加'],
      },
      targetWorkTypeIds: ['worktype-1', 'worktype-2'],
      requiredPersonnelCount: 3,
      candidateSiteIds: ['site-B', 'site-C'],
      analysisDate: analysisDateString,
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85,
    };

    // Mock validateInputData to return valid input
    const validateInputDataSpy = jest.spyOn(personnelReallocationModule, 'validateInputData' as any).mockReturnValue(true);

    // Mock identifyReallocatablePersonnelAndSources to return available personnel
    // All skill match degrees are below 50% threshold for all work types
    const identifyReallocatablePersonnelAndSourcesSpy = jest.spyOn(personnelReallocationModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue({
      reallocatableSources: [
        {
          siteId: 'site-B',
          availablePersonnelCount: 2,
          priorityScore: 85,
          workloadAfterReallocation: 80,
          deliveryMarginAfterReallocation: 120,
          recommendedWorkerIds: ['worker-b1', 'worker-b2'],
          skillMatchDegrees: { 'worktype-1': 35, 'worktype-2': 40 },
          riskFactors: ['Low skill match'],
        },
        {
          siteId: 'site-C',
          availablePersonnelCount: 1,
          priorityScore: 80,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 150,
          recommendedWorkerIds: ['worker-c1'],
          skillMatchDegrees: { 'worktype-1': 45, 'worktype-2': 48 },
          riskFactors: ['Low skill match'],
        },
      ],
      totalAvailablePersonnelCount: 3,
      isSufficientCapacity: true,
      dataQualityWarnings: null,
      identifiedAt: currentTime,
    });

    // Mock calculateWorkloadAndCapacityBysite
    const calculateWorkloadAndCapacityBysiteSpy = jest.spyOn(personnelReallocationModule, 'calculateWorkloadAndCapacityBysite' as any).mockImplementation(
      async (input: any) => {
        if (input.siteId === 'site-B') {
          return {
            siteId: 'site-B',
            currentWorkload: 80,
            totalCapacityMinutes: 28800,
            usedCapacityMinutes: 23040,
            availableCapacityMinutes: 5760,
            activeWorkerCount: 12,
            totalWorkerCount: 14,
            averageProductivityRate: 85,
            dataQualityScore: 90,
            calculatedAt: currentTime,
          };
        } else if (input.siteId === 'site-C') {
          return {
            siteId: 'site-C',
            currentWorkload: 75,
            totalCapacityMinutes: 28800,
            usedCapacityMinutes: 21600,
            availableCapacityMinutes: 7200,
            activeWorkerCount: 10,
            totalWorkerCount: 12,
            averageProductivityRate: 80,
            dataQualityScore: 88,
            calculatedAt: currentTime,
          };
        }
      }
    );

    // Mock assessDeliveryMarginBySite
    const assessDeliveryMarginBySiteSpy = jest.spyOn(personnelReallocationModule, 'assessDeliveryMarginBySite' as any).mockImplementation(
      async (input: any) => {
        if (input.siteId === 'site-B') {
          return {
            siteId: 'site-B',
            deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            remainingDays: 7,
            remainingHours: 168,
            currentProgressRate: 65,
            requiredProgressRatePerDay: 5,
            deliveryMarginScore: 120,
            marginLevel: 'safe',
            assessedAt: currentTime,
          };
        } else if (input.siteId === 'site-C') {
          return {
            siteId: 'site-C',
            deliveryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            remainingDays: 8,
            remainingHours: 192,
            currentProgressRate: 70,
            requiredProgressRatePerDay: 3.75,
            deliveryMarginScore: 150,
            marginLevel: 'safe',
            assessedAt: currentTime,
          };
        }
      }
    );

    // Mock evaluateSkillMatchDegree to return all match degrees below 50%
    // Covers all combinations: worker-b1, worker-b2, worker-c1 with worktype-1, worktype-2
    const evaluateSkillMatchDegreeSpy = jest.spyOn(personnelReallocationModule, 'evaluateSkillMatchDegree' as any).mockImplementation(
      async (input: any) => {
        let matchDegree = 0;
        // site-B workers: all degrees below 50%
        if (input.sourceWorkerId === 'worker-b1' || input.sourceWorkerId === 'worker-b2') {
          matchDegree = input.targetWorkTypeId === 'worktype-1' ? 35 : 40;
        }
        // site-C worker: all degrees below 50%
        else if (input.sourceWorkerId === 'worker-c1') {
          matchDegree = input.targetWorkTypeId === 'worktype-1' ? 45 : 48;
        }

        return {
          sourceWorkerId: input.sourceWorkerId,
          targetWorkTypeId: input.targetWorkTypeId,
          matchDegree: matchDegree,
          matchLevel: matchDegree >= 80 ? 'excellent' : matchDegree >= 60 ? 'good' : matchDegree >= 40 ? 'acceptable' : 'poor',
          evaluationFactors: {
            jobTypeAlignment: matchDegree - 5,
            productivityAlignment: matchDegree - 3,
            difficultyAlignment: matchDegree - 7,
            experienceRelevance: matchDegree - 10,
          },
          matchingJustification: `Skill match degree is ${matchDegree}%, below threshold.`,
          riskFactors: ['Low skill match', 'May require training'],
          evaluatedAt: currentTime,
        };
      }
    );

    // Mock findWorkersByIds
    const findWorkersByIdsSpy = jest.spyOn(personnelReallocationModule, 'findWorkersByIds' as any).mockResolvedValue([
      { workerId: 'worker-b1', name: 'Worker B1', siteId: 'site-B' },
      { workerId: 'worker-b2', name: 'Worker B2', siteId: 'site-B' },
      { workerId: 'worker-c1', name: 'Worker C1', siteId: 'site-C' },
    ]);

    // Mock findProductivityDataByWorkerIds
    const findProductivityDataByWorkerIdsSpy = jest.spyOn(personnelReallocationModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue([
      { workerId: 'worker-b1', productivityRate: 85 },
      { workerId: 'worker-b2', productivityRate: 82 },
      { workerId: 'worker-c1', productivityRate: 80 },
    ]);

    // Mock findProductivityDataBySiteAndPeriod
    const findProductivityDataBySiteAndPeriodSpy = jest.spyOn(personnelReallocationModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue([]);

    // Mock findPlacementPlansByTeamAndDate
    const findPlacementPlansByTeamAndDateSpy = jest.spyOn(personnelReallocationModule, 'findPlacementPlansByTeamAndDate' as any).mockResolvedValue([]);

    // Mock findWorkTypeById
    const findWorkTypeByIdSpy = jest.spyOn(personnelReallocationModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'worktype-1',
      workTypeName: 'Assembly',
      standardProductivity: 50,
    });

    // Mock retrieveLatestValidCacheForPlacementGeneration
    const retrieveLatestValidCacheForPlacementGenerationSpy = jest.spyOn(personnelReallocationModule, 'retrieveLatestValidCacheForPlacementGeneration' as any).mockResolvedValue(null);

    // Execute the function and verify that SkillMismatchError is thrown
    let errorThrown = false;
    let thrownError: any = null;
    let result: any = undefined;

    try {
      result = await judgePersonnelReallocationFeasibility(input);
    } catch (error) {
      errorThrown = true;
      thrownError = error;
    }

    // Verify that SkillMismatchError was thrown
    expect(errorThrown).toBe(true);
    expect(thrownError).not.toBeNull();
    expect(thrownError.name).toBe('SkillMismatchError');
    expect(thrownError.message).toBe('スキルマッチ度が低いため、推奨される人員融通案がありません。研修を伴う配置を検討してください。');

    // Verify that no output was returned (output type not returned)
    expect(result).toBeUndefined();

    // Verify that validateInputData was called with the input
    expect(validateInputDataSpy).toHaveBeenCalled();

    // Verify that identifyReallocatablePersonnelAndSources was called
    expect(identifyReallocatablePersonnelAndSourcesSpy).toHaveBeenCalled();

    // Verify that evaluateSkillMatchDegree was called for each worker and work type
    expect(evaluateSkillMatchDegreeSpy).toHaveBeenCalled();

    // Verify that calculateWorkloadAndCapacityBysite was called
    expect(calculateWorkloadAndCapacityBysiteSpy).toHaveBeenCalled();

    // Verify that assessDeliveryMarginBySite was called
    expect(assessDeliveryMarginBySiteSpy).toHaveBeenCalled();
  });
});