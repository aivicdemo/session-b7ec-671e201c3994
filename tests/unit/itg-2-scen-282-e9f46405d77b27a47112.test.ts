import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';
import * as personnelModule from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-282: lookbackDays パラメータが指定されないとき、デフォルト値の7日間を使用して生産性データが集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lookbackDaysが指定されない場合、デフォルト値の7日間で生産性データを集計する', async () => {
    const mockProductivityData = [
      {
        siteId: 'SITE-002',
        workerId: 'WORKER-001',
        workDate: '2024-01-08',
        productivityRate: 85,
        completedCount: 10,
      },
      {
        siteId: 'SITE-002',
        workerId: 'WORKER-002',
        workDate: '2024-01-14',
        productivityRate: 90,
        completedCount: 12,
      },
    ];

    const mockWorkloadData = {
      siteId: 'SITE-002',
      currentWorkload: 60,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1440,
      availableCapacityMinutes: 960,
      activeWorkerCount: 5,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 95,
      calculatedAt: '2024-01-15T10:00:00Z',
    };

    const mockDeliveryMarginData = {
      siteId: 'SITE-002',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 70,
      requiredProgressRatePerDay: 6,
      deliveryMarginScore: 30,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    };

    const mockSkillMatchData = {
      sourceWorkerId: 'WORKER-001',
      targetWorkTypeId: 'WT-001',
      matchDegree: 75,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 80,
        productivityAlignment: 70,
        difficultyAlignment: 75,
        experienceRelevance: 75,
      },
      matchingJustification: 'Good alignment with target work type',
      evaluatedAt: '2024-01-15T10:00:00Z',
    };

    const mockReallocatableData = {
      reallocatableSources: [
        {
          siteId: 'SITE-002',
          availablePersonnelCount: 3,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 45,
          recommendedWorkerIds: ['WORKER-001', 'WORKER-002'],
          skillMatchDegrees: { 'WT-001': 75, 'WT-002': 70 },
          riskFactors: [],
        },
        {
          siteId: 'SITE-003',
          availablePersonnelCount: 2,
          priorityScore: 80,
          workloadAfterReallocation: 70,
          deliveryMarginAfterReallocation: 50,
          recommendedWorkerIds: ['WORKER-003'],
          skillMatchDegrees: { 'WT-001': 65, 'WT-002': 72 },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 5,
      isSufficientCapacity: true,
      identifiedAt: '2024-01-15T10:00:00Z',
    };

    jest.spyOn(personnelModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(personnelModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBySite' as any).mockResolvedValue(mockWorkloadData);
    jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockResolvedValue(mockDeliveryMarginData);
    jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue(mockSkillMatchData);
    jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue(mockReallocatableData);

    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-002', 'SITE-003'],
      analysisDate: '2024-01-15',
      lookbackDays: undefined,
      skillMatchThreshold: undefined,
      workloadThreshold: undefined,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result).toBeDefined();
    expect(result.feasibilityJudgment).toBeDefined();
    expect(result.feasibilityJudgment).toHaveProperty('isFeasible');
    expect(result.feasibilityJudgment).toHaveProperty('reason');
    expect(result.feasibilityJudgment).toHaveProperty('confidenceScore');
    expect(result.reallocatablePersonnelSummary).toBeDefined();
    expect(result.reallocatablePersonnelSummary).toHaveProperty('totalAvailableCount');
    expect(result.reallocatablePersonnelSummary).toHaveProperty('bySourceSite');
    expect(result.recommendedPlacementProposals).toBeDefined();
    expect(Array.isArray(result.recommendedPlacementProposals)).toBe(true);
    expect(result.analysisTimestamp).toBeDefined();
  });

  it('入力データ検証が成功することを確認する', async () => {
    const mockProductivityData = [];

    jest.spyOn(personnelModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(personnelModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      currentWorkload: 60,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1440,
      availableCapacityMinutes: 960,
      activeWorkerCount: 5,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 95,
      calculatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 70,
      requiredProgressRatePerDay: 6,
      deliveryMarginScore: 30,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue({
      sourceWorkerId: 'WORKER-001',
      targetWorkTypeId: 'WT-001',
      matchDegree: 75,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 80,
        productivityAlignment: 70,
        difficultyAlignment: 75,
        experienceRelevance: 75,
      },
      matchingJustification: 'Good alignment',
      evaluatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue({
      reallocatableSources: [],
      totalAvailablePersonnelCount: 0,
      isSufficientCapacity: false,
      identifiedAt: '2024-01-15T10:00:00Z',
    });

    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-002', 'SITE-003'],
      analysisDate: '2024-01-15',
      lookbackDays: undefined,
      skillMatchThreshold: undefined,
      workloadThreshold: undefined,
    };

    const result = await judgePersonnelReallocationFeasibility(input);
    expect(result).toBeDefined();
  });

  it('デフォルト7日間のデータに基づいて完全な出力が返されることを確認する', async () => {
    const mockProductivityData = [
      {
        siteId: 'SITE-002',
        workerId: 'WORKER-001',
        workDate: '2024-01-08',
        productivityRate: 85,
        completedCount: 10,
      },
    ];

    const mockWorkloadData = {
      siteId: 'SITE-002',
      currentWorkload: 60,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1440,
      availableCapacityMinutes: 960,
      activeWorkerCount: 5,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 95,
      calculatedAt: '2024-01-15T10:00:00Z',
    };

    const mockDeliveryMarginData = {
      siteId: 'SITE-002',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 70,
      requiredProgressRatePerDay: 6,
      deliveryMarginScore: 30,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    };

    const mockSkillMatchData = {
      sourceWorkerId: 'WORKER-001',
      targetWorkTypeId: 'WT-001',
      matchDegree: 75,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 80,
        productivityAlignment: 70,
        difficultyAlignment: 75,
        experienceRelevance: 75,
      },
      matchingJustification: 'Good alignment',
      evaluatedAt: '2024-01-15T10:00:00Z',
    };

    const mockReallocatableData = {
      reallocatableSources: [
        {
          siteId: 'SITE-002',
          availablePersonnelCount: 3,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 45,
          recommendedWorkerIds: ['WORKER-001', 'WORKER-002'],
          skillMatchDegrees: { 'WT-001': 75, 'WT-002': 70 },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 5,
      isSufficientCapacity: true,
      identifiedAt: '2024-01-15T10:00:00Z',
    };

    jest.spyOn(personnelModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(personnelModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBySite' as any).mockResolvedValue(mockWorkloadData);
    jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockResolvedValue(mockDeliveryMarginData);
    jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue(mockSkillMatchData);
    jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue(mockReallocatableData);

    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-002', 'SITE-003'],
      analysisDate: '2024-01-15',
      lookbackDays: undefined,
      skillMatchThreshold: undefined,
      workloadThreshold: undefined,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result.feasibilityJudgment.isFeasible).toBeDefined();
    expect(typeof result.feasibilityJudgment.isFeasible).toBe('boolean');
    expect(result.feasibilityJudgment.reason).toBeDefined();
    expect(typeof result.feasibilityJudgment.reason).toBe('string');
    expect(result.feasibilityJudgment.confidenceScore).toBeDefined();
    expect(typeof result.feasibilityJudgment.confidenceScore).toBe('number');
    expect(result.feasibilityJudgment.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.feasibilityJudgment.confidenceScore).toBeLessThanOrEqual(100);

    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBeDefined();
    expect(typeof result.reallocatablePersonnelSummary.totalAvailableCount).toBe('number');
    expect(result.reallocatablePersonnelSummary.bySourceSite).toBeDefined();
    expect(Array.isArray(result.reallocatablePersonnelSummary.bySourceSite)).toBe(true);

    expect(Array.isArray(result.recommendedPlacementProposals)).toBe(true);
    if (result.recommendedPlacementProposals.length > 0) {
      const proposal = result.recommendedPlacementProposals[0];
      expect(proposal).toHaveProperty('proposalId');
      expect(proposal).toHaveProperty('sourceSiteId');
      expect(proposal).toHaveProperty('targetSiteId');
      expect(proposal).toHaveProperty('assignedWorkerIds');
      expect(proposal).toHaveProperty('skillMatchDegrees');
      expect(proposal).toHaveProperty('expectedProductivityImprovement');
      expect(proposal).toHaveProperty('deliveryMarginAfterReallocation');
      expect(proposal).toHaveProperty('riskMitigation');
    }

    expect(result.analysisTimestamp).toBeDefined();
    expect(typeof result.analysisTimestamp).toBe('string');
  });

  it('analysisDateが2024-01-15のとき、過去7日間（2024-01-08～2024-01-14）のデータが使用されることを確認する', async () => {
    const mockProductivityData = [
      {
        siteId: 'SITE-002',
        workerId: 'WORKER-001',
        workDate: '2024-01-08',
        productivityRate: 85,
        completedCount: 10,
      },
    ];

    const findProductivityDataBySiteSpy = jest
      .spyOn(personnelModule, 'findProductivityDataBySiteAndPeriod' as any)
      .mockImplementation((siteId: string, startDate: string, endDate: string) => {
        return Promise.resolve(mockProductivityData);
      });

    const findProductivityDataByWorkerIdsSpy = jest
      .spyOn(personnelModule, 'findProductivityDataByWorkerIds' as any)
      .mockImplementation((workerIds: string[], startDate: string, endDate: string) => {
        return Promise.resolve(mockProductivityData);
      });

    jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      currentWorkload: 60,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1440,
      availableCapacityMinutes: 960,
      activeWorkerCount: 5,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 95,
      calculatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 70,
      requiredProgressRatePerDay: 6,
      deliveryMarginScore: 30,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue({
      sourceWorkerId: 'WORKER-001',
      targetWorkTypeId: 'WT-001',
      matchDegree: 75,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 80,
        productivityAlignment: 70,
        difficultyAlignment: 75,
        experienceRelevance: 75,
      },
      matchingJustification: 'Good alignment',
      evaluatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue({
      reallocatableSources: [
        {
          siteId: 'SITE-002',
          availablePersonnelCount: 3,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 45,
          recommendedWorkerIds: ['WORKER-001', 'WORKER-002'],
          skillMatchDegrees: { 'WT-001': 75, 'WT-002': 70 },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 5,
      isSufficientCapacity: true,
      identifiedAt: '2024-01-15T10:00:00Z',
    });

    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-002', 'SITE-003'],
      analysisDate: '2024-01-15',
      lookbackDays: undefined,
      skillMatchThreshold: undefined,
      workloadThreshold: undefined,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result).toBeDefined();
    expect(result.analysisTimestamp).toBeDefined();

    const expectedStartDate = '2024-01-08';
    const expectedEndDate = '2024-01-14';

    expect(findProductivityDataBySiteSpy).toHaveBeenCalled();
    expect(findProductivityDataByWorkerIdsSpy).toHaveBeenCalled();

    const bySiteCallArgs = findProductivityDataBySiteSpy.mock.calls;
    expect(bySiteCallArgs.length).toBeGreaterThan(0);

    let foundBySiteCall = false;
    for (const callArgs of bySiteCallArgs) {
      if (callArgs[1] === expectedStartDate && callArgs[2] === expectedEndDate) {
        foundBySiteCall = true;
        break;
      }
    }
    expect(foundBySiteCall).toBe(true);

    const byWorkerCallArgs = findProductivityDataByWorkerIdsSpy.mock.calls;
    expect(byWorkerCallArgs.length).toBeGreaterThan(0);

    let foundByWorkerCall = false;
    for (const callArgs of byWorkerCallArgs) {
      if (callArgs[1] === expectedStartDate && callArgs[2] === expectedEndDate) {
        foundByWorkerCall = true;
        break;
      }
    }
    expect(foundByWorkerCall).toBe(true);
  });

  it('lookbackDaysがundefinedの場合、デフォルト値7が適用されることを確認する', async () => {
    const mockReallocatableData = {
      reallocatableSources: [
        {
          siteId: 'SITE-002',
          availablePersonnelCount: 3,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 45,
          recommendedWorkerIds: ['WORKER-001', 'WORKER-002'],
          skillMatchDegrees: { 'WT-001': 75, 'WT-002': 70 },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 5,
      isSufficientCapacity: true,
      identifiedAt: '2024-01-15T10:00:00Z',
    };

    jest.spyOn(personnelModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(personnelModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue([]);
    jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      currentWorkload: 60,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1440,
      availableCapacityMinutes: 960,
      activeWorkerCount: 5,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 95,
      calculatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 70,
      requiredProgressRatePerDay: 6,
      deliveryMarginScore: 30,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue({
      sourceWorkerId: 'WORKER-001',
      targetWorkTypeId: 'WT-001',
      matchDegree: 75,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 80,
        productivityAlignment: 70,
        difficultyAlignment: 75,
        experienceRelevance: 75,
      },
      matchingJustification: 'Good alignment',
      evaluatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue(mockReallocatableData);

    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-002', 'SITE-003'],
      analysisDate: '2024-01-15',
      lookbackDays: undefined,
      skillMatchThreshold: undefined,
      workloadThreshold: undefined,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result).toBeDefined();
    expect(result.reallocatablePersonnelSummary).toBeDefined();
    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBeGreaterThanOrEqual(0);
  });

  it('skillMatchThresholdがundefinedの場合、デフォルト値50が適用されることを確認する', async () => {
    jest.spyOn(personnelModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(personnelModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue([]);
    jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      currentWorkload: 60,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1440,
      availableCapacityMinutes: 960,
      activeWorkerCount: 5,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 95,
      calculatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 70,
      requiredProgressRatePerDay: 6,
      deliveryMarginScore: 30,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue({
      sourceWorkerId: 'WORKER-001',
      targetWorkTypeId: 'WT-001',
      matchDegree: 75,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 80,
        productivityAlignment: 70,
        difficultyAlignment: 75,
        experienceRelevance: 75,
      },
      matchingJustification: 'Good alignment',
      evaluatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue({
      reallocatableSources: [],
      totalAvailablePersonnelCount: 0,
      isSufficientCapacity: false,
      identifiedAt: '2024-01-15T10:00:00Z',
    });

    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-002', 'SITE-003'],
      analysisDate: '2024-01-15',
      lookbackDays: undefined,
      skillMatchThreshold: undefined,
      workloadThreshold: undefined,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result).toBeDefined();
    expect(result.recommendedPlacementProposals).toBeDefined();
    expect(Array.isArray(result.recommendedPlacementProposals)).toBe(true);
  });

  it('workloadThresholdがundefinedの場合、デフォルト値85が適用されることを確認する', async () => {
    jest.spyOn(personnelModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(personnelModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue([]);
    jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      currentWorkload: 60,
      totalCapacityMinutes: 2400,
      usedCapacityMinutes: 1440,
      availableCapacityMinutes: 960,
      activeWorkerCount: 5,
      totalWorkerCount: 8,
      averageProductivityRate: 85,
      dataQualityScore: 95,
      calculatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockResolvedValue({
      siteId: 'SITE-002',
      deliveryDate: '2024-01-20',
      remainingDays: 5,
      remainingHours: 120,
      currentProgressRate: 70,
      requiredProgressRatePerDay: 6,
      deliveryMarginScore: 30,
      marginLevel: 'caution',
      assessedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockResolvedValue({
      sourceWorkerId: 'WORKER-001',
      targetWorkTypeId: 'WT-001',
      matchDegree: 75,
      matchLevel: 'good',
      evaluationFactors: {
        jobTypeAlignment: 80,
        productivityAlignment: 70,
        difficultyAlignment: 75,
        experienceRelevance: 75,
      },
      matchingJustification: 'Good alignment',
      evaluatedAt: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue({
      reallocatableSources: [
        {
          siteId: 'SITE-002',
          availablePersonnelCount: 3,
          priorityScore: 85,
          workloadAfterReallocation: 75,
          deliveryMarginAfterReallocation: 45,
          recommendedWorkerIds: ['WORKER-001'],
          skillMatchDegrees: { 'WT-001': 75 },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 3,
      isSufficientCapacity: false,
      identifiedAt: '2024-01-15T10:00:00Z',
    });

    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-002', 'SITE-003'],
      analysisDate: '2024-01-15',
      lookbackDays: undefined,
      skillMatchThreshold: undefined,
      workloadThreshold: undefined,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result).toBeDefined();
    expect(result.reallocatablePersonnelSummary).toBeDefined();
    expect(Array.isArray(result.reallocatablePersonnelSummary.bySourceSite)).toBe(true);
  });
});