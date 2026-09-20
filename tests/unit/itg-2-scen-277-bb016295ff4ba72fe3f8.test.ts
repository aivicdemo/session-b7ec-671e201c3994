import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';
import * as personnelReallocationModule from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-277: 融通可能と判定された場合、推奨配置案が融通元拠点ごとに融通後の作業負荷を再計算した結果を含めて返される', () => {
  let mockCalculateWorkloadAndCapacityBysite: jest.Mock;
  let mockAssessDeliveryMarginBySite: jest.Mock;
  let mockEvaluateSkillMatchDegree: jest.Mock;
  let mockIdentifyReallocatablePersonnelAndSources: jest.Mock;
  let mockFindProductivityDataBySiteAndPeriod: jest.Mock;
  let mockRetrieveLatestValidCacheForPlacementGeneration: jest.Mock;
  let mockValidateInputData: jest.Mock;

  beforeEach(() => {
    mockCalculateWorkloadAndCapacityBysite = jest.fn((input) => {
      if (input.siteId === 'site-001') {
        return {
          siteId: 'site-001',
          currentWorkload: 95,
          totalCapacityMinutes: 480,
          usedCapacityMinutes: 456,
          availableCapacityMinutes: 24,
          activeWorkerCount: 8,
          totalWorkerCount: 8,
          averageProductivityRate: 85,
          dataQualityScore: 85,
          calculatedAt: '2024-01-15T10:00:00Z',
        };
      } else if (input.siteId === 'site-002') {
        return {
          siteId: 'site-002',
          currentWorkload: 70,
          totalCapacityMinutes: 480,
          usedCapacityMinutes: 336,
          availableCapacityMinutes: 144,
          activeWorkerCount: 6,
          totalWorkerCount: 8,
          averageProductivityRate: 88,
          dataQualityScore: 88,
          calculatedAt: '2024-01-15T10:00:00Z',
        };
      } else if (input.siteId === 'site-003') {
        return {
          siteId: 'site-003',
          currentWorkload: 65,
          totalCapacityMinutes: 480,
          usedCapacityMinutes: 312,
          availableCapacityMinutes: 168,
          activeWorkerCount: 5,
          totalWorkerCount: 8,
          averageProductivityRate: 90,
          dataQualityScore: 90,
          calculatedAt: '2024-01-15T10:00:00Z',
        };
      }
    });

    mockAssessDeliveryMarginBySite = jest.fn((input) => {
      if (input.siteId === 'site-001') {
        return {
          siteId: 'site-001',
          deliveryDate: '2024-01-20T18:00:00Z',
          remainingDays: 5,
          remainingHours: 120,
          currentProgressRate: 50,
          requiredProgressRatePerDay: 10,
          deliveryMarginScore: 20,
          marginLevel: 'critical',
          assessedAt: '2024-01-15T10:00:00Z',
        };
      } else if (input.siteId === 'site-002') {
        return {
          siteId: 'site-002',
          deliveryDate: '2024-01-25T18:00:00Z',
          remainingDays: 10,
          remainingHours: 480,
          currentProgressRate: 40,
          requiredProgressRatePerDay: 6,
          deliveryMarginScore: 65,
          marginLevel: 'safe',
          assessedAt: '2024-01-15T10:00:00Z',
        };
      } else if (input.siteId === 'site-003') {
        return {
          siteId: 'site-003',
          deliveryDate: '2024-01-28T18:00:00Z',
          remainingDays: 13,
          remainingHours: 600,
          currentProgressRate: 35,
          requiredProgressRatePerDay: 5,
          deliveryMarginScore: 80,
          marginLevel: 'safe',
          assessedAt: '2024-01-15T10:00:00Z',
        };
      }
    });

    mockEvaluateSkillMatchDegree = jest.fn((input) => {
      const matchDegreeMap: Record<string, number> = {
        'worker-01-WT-001': 75,
        'worker-01-WT-002': 75,
        'worker-02-WT-001': 78,
        'worker-02-WT-002': 72,
        'worker-03-WT-001': 80,
        'worker-03-WT-002': 80,
        'worker-04-WT-001': 82,
        'worker-04-WT-002': 78,
      };
      const key = `${input.sourceWorkerId}-${input.targetWorkTypeId}`;
      const degree = matchDegreeMap[key] || 75;

      return {
        sourceWorkerId: input.sourceWorkerId,
        targetWorkTypeId: input.targetWorkTypeId,
        matchDegree: degree,
        matchLevel: degree >= 70 ? 'good' : 'acceptable',
        evaluationFactors: {
          jobTypeAlignment: degree,
          productivityAlignment: degree - 5,
          difficultyAlignment: degree - 3,
          experienceRelevance: degree - 2,
        },
        matchingJustification: `Worker ${input.sourceWorkerId} is well-matched to work type ${input.targetWorkTypeId}`,
        riskFactors: degree < 75 ? ['Limited experience'] : [],
        evaluatedAt: '2024-01-15T10:00:00Z',
      };
    });

    mockIdentifyReallocatablePersonnelAndSources = jest.fn(() => ({
      reallocatableSources: [
        {
          siteId: 'site-002',
          availablePersonnelCount: 2,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 420,
          recommendedWorkerIds: ['worker-01', 'worker-02'],
          skillMatchDegrees: {
            'WT-001': 75,
            'WT-002': 75,
          },
          riskFactors: [],
        },
        {
          siteId: 'site-003',
          availablePersonnelCount: 2,
          priorityScore: 88,
          workloadAfterReallocation: 72,
          deliveryMarginAfterReallocation: 540,
          recommendedWorkerIds: ['worker-03', 'worker-04'],
          skillMatchDegrees: {
            'WT-001': 80,
            'WT-002': 80,
          },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 4,
      isSufficientCapacity: true,
      dataQualityWarnings: null,
      identifiedAt: '2024-01-15T10:00:00Z',
    }));

    mockFindProductivityDataBySiteAndPeriod = jest.fn(() => ({
      siteId: 'site-001',
      dataRecords: Array.from({ length: 7 }, (_, i) => ({
        productivityDataID: `prod-${i}`,
        productivityRate: 85 + Math.random() * 10,
        dataDate: new Date(2024, 0, 15 - (6 - i)).toISOString(),
      })),
      dataCompleteness: 85,
    }));

    mockRetrieveLatestValidCacheForPlacementGeneration = jest.fn(() => null);

    mockValidateInputData = jest.fn(() => ({
      isValid: true,
      errors: [],
    }));

    jest.spyOn(personnelReallocationModule, 'calculateWorkloadAndCapacityBysite' as any).mockImplementation(mockCalculateWorkloadAndCapacityBysite);
    jest.spyOn(personnelReallocationModule, 'assessDeliveryMarginBySite' as any).mockImplementation(mockAssessDeliveryMarginBySite);
    jest.spyOn(personnelReallocationModule, 'evaluateSkillMatchDegree' as any).mockImplementation(mockEvaluateSkillMatchDegree);
    jest.spyOn(personnelReallocationModule, 'identifyReallocatablePersonnelAndSources' as any).mockImplementation(mockIdentifyReallocatablePersonnelAndSources);
    jest.spyOn(personnelReallocationModule, 'findProductivityDataBySiteAndPeriod' as any).mockImplementation(mockFindProductivityDataBySiteAndPeriod);
    jest.spyOn(personnelReallocationModule, 'retrieveLatestValidCacheForPlacementGeneration' as any).mockImplementation(mockRetrieveLatestValidCacheForPlacementGeneration);
    jest.spyOn(personnelReallocationModule, 'validateInputData' as any).mockImplementation(mockValidateInputData);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('融通可能と判定された場合、推奨配置案が融通元拠点ごとに融通後の作業負荷を再計算した結果を含めて返される', async () => {
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 3,
      candidateSiteIds: ['site-002', 'site-003'],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result.feasibilityJudgment.isFeasible).toBe(true);
    expect(result.feasibilityJudgment.reason).toBeTruthy();
    expect(result.feasibilityJudgment.confidenceScore).toBeGreaterThanOrEqual(75);

    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBeGreaterThanOrEqual(4);

    expect(result.reallocatablePersonnelSummary.bySourceSite).toHaveLength(2);

    const site002Entry = result.reallocatablePersonnelSummary.bySourceSite.find(
      (entry) => entry.siteId === 'site-002'
    );
    expect(site002Entry).toBeDefined();
    expect(site002Entry!.availableCount).toBeGreaterThanOrEqual(2);
    expect(site002Entry!.workloadAfterReallocation).toBeGreaterThanOrEqual(75);
    expect(site002Entry!.workloadAfterReallocation).toBeLessThanOrEqual(80);

    const site003Entry = result.reallocatablePersonnelSummary.bySourceSite.find(
      (entry) => entry.siteId === 'site-003'
    );
    expect(site003Entry).toBeDefined();
    expect(site003Entry!.availableCount).toBeGreaterThanOrEqual(2);
    expect(site003Entry!.workloadAfterReallocation).toBeGreaterThanOrEqual(70);
    expect(site003Entry!.workloadAfterReallocation).toBeLessThanOrEqual(75);

    expect(result.recommendedPlacementProposals).toBeTruthy();
    expect(result.recommendedPlacementProposals.length).toBeGreaterThan(0);

    result.recommendedPlacementProposals.forEach((proposal) => {
      expect(proposal.proposalId).toBeTruthy();
      expect(['site-002', 'site-003']).toContain(proposal.sourceSiteId);
      expect(proposal.targetSiteId).toBe('site-001');
      expect(proposal.assignedWorkerIds).toBeTruthy();
      expect(proposal.assignedWorkerIds.length).toBeGreaterThan(0);
      expect(proposal.skillMatchDegrees).toBeTruthy();
      expect(proposal.skillMatchDegrees['WT-001']).toBeGreaterThanOrEqual(70);
      expect(proposal.skillMatchDegrees['WT-002']).toBeGreaterThanOrEqual(70);
      expect(proposal.expectedProductivityImprovement).toBeGreaterThan(0);
      expect(proposal.deliveryMarginAfterReallocation).toBeGreaterThan(0);
      expect(proposal.riskMitigation).toBeTruthy();
    });

    expect(result.analysisTimestamp).toBeTruthy();
    const timestamp = new Date(result.analysisTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});