import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';
import * as personnelReallocationModule from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-274: Personnel Reallocation Feasibility with Workload Exceeded Warning', () => {
  it('should include WORKLOAD_EXCEEDED warning when target site workload exceeds 100%', async () => {
    // Prepare test input data
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-001',
        delayRiskScore: 85,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_reallocation'],
      },
      targetWorkTypeIds: ['wt-A', 'wt-B'],
      requiredPersonnelCount: 3,
      candidateSiteIds: ['site-002', 'site-003'],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85,
    };

    // Mock calculateWorkloadAndCapacityBysite to return workload > 100% for target site
    jest.spyOn(personnelReallocationModule, 'calculateWorkloadAndCapacityBysite' as any).mockResolvedValueOnce({
      siteId: 'site-001',
      currentWorkload: 101,
      totalCapacityMinutes: 4800,
      usedCapacityMinutes: 4848,
      availableCapacityMinutes: -48,
      activeWorkerCount: 8,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 90,
      calculatedAt: '2024-01-15T10:00:00Z',
    }).mockResolvedValueOnce({
      siteId: 'site-002',
      currentWorkload: 70,
      totalCapacityMinutes: 4800,
      usedCapacityMinutes: 3360,
      availableCapacityMinutes: 1440,
      activeWorkerCount: 6,
      totalWorkerCount: 8,
      averageProductivityRate: 88,
      dataQualityScore: 92,
      calculatedAt: '2024-01-15T10:00:00Z',
    }).mockResolvedValueOnce({
      siteId: 'site-003',
      currentWorkload: 75,
      totalCapacityMinutes: 4800,
      usedCapacityMinutes: 3600,
      availableCapacityMinutes: 1200,
      activeWorkerCount: 7,
      totalWorkerCount: 8,
      averageProductivityRate: 86,
      dataQualityScore: 91,
      calculatedAt: '2024-01-15T10:00:00Z',
    });

    // Mock assessDeliveryMarginBySite
    jest.spyOn(personnelReallocationModule, 'assessDeliveryMarginBySite' as any).mockResolvedValueOnce({
      siteId: 'site-001',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 60,
      requiredProgressRatePerDay: 8,
      deliveryMarginScore: 20,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    }).mockResolvedValueOnce({
      siteId: 'site-002',
      deliveryDate: '2024-01-22',
      remainingDays: 7,
      remainingHours: 240,
      currentProgressRate: 50,
      requiredProgressRatePerDay: 7.14,
      deliveryMarginScore: 40,
      marginLevel: 'safe',
      assessedAt: '2024-01-15T10:00:00Z',
    }).mockResolvedValueOnce({
      siteId: 'site-003',
      deliveryDate: '2024-01-21',
      remainingDays: 6,
      remainingHours: 200,
      currentProgressRate: 55,
      requiredProgressRatePerDay: 7.5,
      deliveryMarginScore: 35,
      marginLevel: 'safe',
      assessedAt: '2024-01-15T10:00:00Z',
    });

    // Mock evaluateSkillMatchDegree
    jest.spyOn(personnelReallocationModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue({
      sourceWorkerId: 'worker-001',
      targetWorkTypeId: 'wt-A',
      matchDegree: 65,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 70,
        productivityAlignment: 65,
        difficultyAlignment: 60,
        experienceRelevance: 65,
      },
      matchingJustification: 'Worker has relevant experience with similar work types',
      riskFactors: [],
      evaluatedAt: '2024-01-15T10:00:00Z',
    });

    // Mock identifyReallocatablePersonnelAndSources
    jest.spyOn(personnelReallocationModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue({
      reallocatableSources: [
        {
          siteId: 'site-002',
          availablePersonnelCount: 2,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 30,
          recommendedWorkerIds: ['worker-002', 'worker-003'],
          skillMatchDegrees: { 'wt-A': 65, 'wt-B': 60 },
          riskFactors: [],
        },
        {
          siteId: 'site-003',
          availablePersonnelCount: 2,
          priorityScore: 80,
          workloadAfterReallocation: 80,
          deliveryMarginAfterReallocation: 25,
          recommendedWorkerIds: ['worker-004', 'worker-005'],
          skillMatchDegrees: { 'wt-A': 72, 'wt-B': 68 },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 4,
      isSufficientCapacity: true,
      dataQualityWarnings: null,
      identifiedAt: '2024-01-15T10:00:00Z',
    });

    // Call the function under test
    const result = await judgePersonnelReallocationFeasibility(input);

    // Verify dataQualityWarnings contains WORKLOAD_EXCEEDED warning
    expect(result.dataQualityWarnings).toBeDefined();
    expect(result.dataQualityWarnings).not.toBeNull();
    expect(Array.isArray(result.dataQualityWarnings)).toBe(true);

    const workloadExceededWarning = result.dataQualityWarnings?.find(
      (warning) => warning.siteId === 'site-001' && warning.warningType === 'WORKLOAD_EXCEEDED'
    );

    expect(workloadExceededWarning).toBeDefined();
    expect(workloadExceededWarning?.message).toBe(
      '対象拠点の作業負荷が既に上限を超えています。人員融通だけでは対応できない可能性があります'
    );

    // Verify feasibilityJudgment is returned
    expect(result.feasibilityJudgment).toBeDefined();
    expect(typeof result.feasibilityJudgment.isFeasible).toBe('boolean');
    expect(typeof result.feasibilityJudgment.reason).toBe('string');
    expect(typeof result.feasibilityJudgment.confidenceScore).toBe('number');
    expect(result.feasibilityJudgment.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.feasibilityJudgment.confidenceScore).toBeLessThanOrEqual(100);

    // Verify recommendedPlacementProposals are generated regardless of warning
    expect(result.recommendedPlacementProposals).toBeDefined();
    expect(Array.isArray(result.recommendedPlacementProposals)).toBe(true);
    expect(result.recommendedPlacementProposals.length).toBeGreaterThanOrEqual(0);

    // Verify reallocatablePersonnelSummary is present
    expect(result.reallocatablePersonnelSummary).toBeDefined();
    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.reallocatablePersonnelSummary.bySourceSite)).toBe(true);
    result.reallocatablePersonnelSummary.bySourceSite.forEach((source) => {
      expect(source.siteId).toBeDefined();
      expect(typeof source.availableCount).toBe('number');
      expect(typeof source.workloadAfterReallocation).toBe('number');
    });

    // Verify analysisTimestamp is present and valid
    expect(result.analysisTimestamp).toBeDefined();
    expect(typeof result.analysisTimestamp).toBe('string');
    expect(() => new Date(result.analysisTimestamp)).not.toThrow();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});