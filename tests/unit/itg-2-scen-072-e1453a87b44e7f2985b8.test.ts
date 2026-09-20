import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-072: 生産性パターンの説明文が空文字列でも、パターン名と平均生産性率が存在すれば返却される', () => {
  let mockFindWorkersByClassificationAndSite: jest.Mock;
  let mockFindProductivityDataByWorkerIds: jest.Mock;
  let mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.Mock;
  let mockSaveInitialAssignment: jest.Mock;
  let mockSendNotificationToAdministrator: jest.Mock;

  beforeEach(() => {
    mockFindWorkersByClassificationAndSite = jest.fn();
    mockFindProductivityDataByWorkerIds = jest.fn();
    mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns = jest.fn();
    mockSaveInitialAssignment = jest.fn();
    mockSendNotificationToAdministrator = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return peerProductivityPatterns with empty description string when pattern data is valid', async () => {
    const mockWorkers = [
      { workerId: 'W002', name: 'Worker2', jobClassification: 'ピッキング作業員', siteId: 'S001' },
      { workerId: 'W003', name: 'Worker3', jobClassification: 'ピッキング作業員', siteId: 'S001' },
      { workerId: 'W004', name: 'Worker4', jobClassification: 'ピッキング作業員', siteId: 'S001' },
    ];

    const mockProductivityData = [
      {
        workerId: 'W002',
        workDate: '2025-01-15',
        completedItems: 150,
        workTimeMinutes: 480,
        productivityRate: 0.87,
      },
      {
        workerId: 'W003',
        workDate: '2025-01-15',
        completedItems: 145,
        workTimeMinutes: 480,
        productivityRate: 0.85,
      },
      {
        workerId: 'W004',
        workDate: '2025-01-15',
        completedItems: 155,
        workTimeMinutes: 480,
        productivityRate: 0.89,
      },
    ];

    const mockPeerPatterns = [
      {
        patternName: 'パターンA',
        description: '',
        averageProductivityRate: 0.87,
        strengthWorkTypes: ['作業タイプ1', '作業タイプ2'],
      },
    ];

    mockFindWorkersByClassificationAndSite.mockResolvedValue(mockWorkers);
    mockFindProductivityDataByWorkerIds.mockResolvedValue(mockProductivityData);
    mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns.mockResolvedValue({
      peerProductivityPatterns: mockPeerPatterns,
      proposedWorkTypes: [
        {
          workTypeId: 'WT001',
          workTypeName: '作業タイプ1',
          recommendationReason: '既存作業者の得意作業として認識',
          expectedProductivityRate: 0.87,
        },
        {
          workTypeId: 'WT002',
          workTypeName: '作業タイプ2',
          recommendationReason: '生産性パターンの強み分野',
          expectedProductivityRate: 0.85,
        },
      ],
      estimatedProficiencyDays: 14,
    });

    mockSaveInitialAssignment.mockResolvedValue('assign-20250115-001');
    mockSendNotificationToAdministrator.mockResolvedValue('sent');

    const input = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'ピッキング作業員',
      assignedSiteId: 'S001',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2025-01-15',
      executingUserId: 'ADMIN001',
      historicalDataLookbackDays: 90,
    };

    // 入力データの必須フィールド・形式を確認
    expect(input.newAssigneeWorkerId).toBeTruthy();
    expect(typeof input.newAssigneeWorkerId).toBe('string');
    expect(input.jobClassification).toBeTruthy();
    expect(typeof input.jobClassification).toBe('string');
    expect(input.assignedSiteId).toBeTruthy();
    expect(typeof input.assignedSiteId).toBe('string');
    expect(input.assignedTeamId).toBeTruthy();
    expect(typeof input.assignedTeamId).toBe('string');
    expect(input.assignedDepartmentId).toBeTruthy();
    expect(typeof input.assignedDepartmentId).toBe('string');
    expect(input.assignmentStartDate).toBeTruthy();
    expect(typeof input.assignmentStartDate).toBe('string');
    expect(input.historicalDataLookbackDays).toBeGreaterThan(0);
    expect(input.executingUserId).toBeTruthy();
    expect(typeof input.executingUserId).toBe('string');

    // executingUserIdが管理者権限を有することを確認
    expect(input.executingUserId).toBe('ADMIN001');

    const mockAiClient = {
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns,
      saveInitialAssignment: mockSaveInitialAssignment,
      sendNotificationToAdministrator: mockSendNotificationToAdministrator,
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    // findWorkersByClassificationAndSiteが呼ばれたことを確認
    expect(mockFindWorkersByClassificationAndSite).toHaveBeenCalledWith(
      input.jobClassification,
      input.assignedSiteId
    );

    // findProductivityDataByWorkerIdsが呼ばれたことを確認
    expect(mockFindProductivityDataByWorkerIds).toHaveBeenCalledWith(
      expect.arrayContaining(['W002', 'W003', 'W004']),
      input.historicalDataLookbackDays
    );

    // analyzeOnboardingContextAndExtractPeerPerformancePatternsが呼ばれたことを確認
    expect(mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns).toHaveBeenCalled();

    // saveInitialAssignmentが呼ばれたことを確認
    expect(mockSaveInitialAssignment).toHaveBeenCalled();

    // sendNotificationToAdministratorが呼ばれたことを確認
    expect(mockSendNotificationToAdministrator).toHaveBeenCalled();

    // 戻り値の検証
    expect(result.success).toBe(true);
    expect(result.initialAssignmentId).toBe('assign-20250115-001');
    expect(result.peerProductivityPatterns).toHaveLength(1);
    expect(result.peerProductivityPatterns[0].patternName).toBe('パターンA');
    expect(result.peerProductivityPatterns[0].description).toBe('');
    expect(result.peerProductivityPatterns[0].averageProductivityRate).toBe(0.87);
    expect(result.peerProductivityPatterns[0].strengthWorkTypes).toEqual(['作業タイプ1', '作業タイプ2']);
    expect(result.proposedWorkTypes.length).toBeGreaterThan(0);
    expect(result.proposedWorkTypes[0]).toHaveProperty('workTypeId');
    expect(result.proposedWorkTypes[0]).toHaveProperty('workTypeName');
    expect(result.proposedWorkTypes[0]).toHaveProperty('recommendationReason');
    expect(result.proposedWorkTypes[0]).toHaveProperty('expectedProductivityRate');
    expect(typeof result.estimatedProficiencyDays).toBe('number');
    expect(result.approverNotificationStatus).toBe('sent');
    expect(result.errorDetails).toBeNull();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});