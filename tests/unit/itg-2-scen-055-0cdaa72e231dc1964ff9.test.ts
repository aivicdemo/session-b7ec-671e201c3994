import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-055: 複数の既存作業者の生産性パターンが分析対象として複数件返却される', () => {
  let mockAuthenticateUser: jest.Mock;
  let mockAuthorizeUserAction: jest.Mock;
  let mockValidateInputData: jest.Mock;
  let mockFindWorkersByClassificationAndSite: jest.Mock;
  let mockFindProductivityDataByWorkerIds: jest.Mock;
  let mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.Mock;
  let mockSaveInitialAssignment: jest.Mock;
  let mockSendNotificationToAdministrator: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticateUser = jest.fn().mockResolvedValue({
      userId: 'ADMIN-001',
      role: 'admin',
      permissions: ['PLACEMENT_GENERATION'],
    });

    mockAuthorizeUserAction = jest.fn().mockResolvedValue(true);

    mockValidateInputData = jest.fn().mockResolvedValue(true);

    mockFindWorkersByClassificationAndSite = jest.fn().mockResolvedValue([
      { workerId: 'WORKER-101', name: 'Worker 1', jobClassification: 'ピッキング' },
      { workerId: 'WORKER-102', name: 'Worker 2', jobClassification: 'ピッキング' },
      { workerId: 'WORKER-103', name: 'Worker 3', jobClassification: 'ピッキング' },
    ]);

    mockFindProductivityDataByWorkerIds = jest.fn().mockResolvedValue([
      {
        workerId: 'WORKER-101',
        records: [
          { date: '2024-12-01', productivityRate: 95, workType: '仕分け', duration: 480 },
          { date: '2024-12-02', productivityRate: 94, workType: '仕分け', duration: 480 },
        ],
      },
      {
        workerId: 'WORKER-102',
        records: [
          { date: '2024-12-01', productivityRate: 88, workType: '検査', duration: 480 },
          { date: '2024-12-02', productivityRate: 89, workType: '検査', duration: 480 },
        ],
      },
      {
        workerId: 'WORKER-103',
        records: [
          { date: '2024-12-01', productivityRate: 91, workType: '梱包', duration: 480 },
          { date: '2024-12-02', productivityRate: 90, workType: '梱包', duration: 480 },
        ],
      },
    ]);

    mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns = jest
      .fn()
      .mockResolvedValue({
        peerProductivityPatterns: [
          {
            patternName: '速度重視型',
            description: '処理速度を重視し、高い生産性を発揮するパターン',
            averageProductivityRate: 95,
            strengthWorkTypes: ['仕分け', '検品'],
          },
          {
            patternName: '品質重視型',
            description: '品質を重視し、正確性を優先するパターン',
            averageProductivityRate: 88,
            strengthWorkTypes: ['検査', '検品'],
          },
          {
            patternName: 'バランス型',
            description: '速度と品質のバランスが取れたパターン',
            averageProductivityRate: 91,
            strengthWorkTypes: ['梱包', '仕分け'],
          },
        ],
        proposedWorkTypes: [
          {
            workTypeId: 'WT-001',
            workTypeName: '仕分け',
            recommendationReason: '速度重視型との適合性が高い',
            expectedProductivityRate: 92,
          },
          {
            workTypeId: 'WT-002',
            workTypeName: '梱包',
            recommendationReason: 'バランス型との適合性が高い',
            expectedProductivityRate: 88,
          },
          {
            workTypeId: 'WT-003',
            workTypeName: '検査',
            recommendationReason: '品質重視型との適合性が高い',
            expectedProductivityRate: 85,
          },
        ],
        estimatedProficiencyDays: 21,
      });

    mockSaveInitialAssignment = jest.fn().mockResolvedValue({
      assignmentId: 'ASSIGN-NEW-001-20250115',
      success: true,
    });

    mockSendNotificationToAdministrator = jest.fn().mockResolvedValue({
      notificationStatus: 'sent',
    });
  });

  test('should generate initial assignment with multiple peer productivity patterns', async () => {
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'NEW-001',
      jobClassification: 'ピッキング',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2025-01-15T00:00:00Z',
      executingUserId: 'ADMIN-001',
      historicalDataLookbackDays: 90,
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns,
      saveInitialAssignment: mockSaveInitialAssignment,
      sendNotificationToAdministrator: mockSendNotificationToAdministrator,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(result.success).toBe(true);
    expect(result.initialAssignmentId).toBe('ASSIGN-NEW-001-20250115');
    expect(result.initialAssignmentId).not.toBeNull();

    expect(Array.isArray(result.proposedWorkTypes)).toBe(true);
    expect(result.proposedWorkTypes.length).toBeGreaterThanOrEqual(3);
    result.proposedWorkTypes.forEach((workType) => {
      expect(workType).toHaveProperty('workTypeId');
      expect(workType).toHaveProperty('workTypeName');
      expect(workType).toHaveProperty('recommendationReason');
      expect(workType).toHaveProperty('expectedProductivityRate');
      expect(typeof workType.expectedProductivityRate).toBe('number');
    });

    expect(Array.isArray(result.peerProductivityPatterns)).toBe(true);
    expect(result.peerProductivityPatterns.length).toBeGreaterThanOrEqual(3);

    const patternNames = result.peerProductivityPatterns.map((p) => p.patternName);
    const uniquePatternNames = new Set(patternNames);
    expect(uniquePatternNames.size).toBeGreaterThanOrEqual(3);

    const productivityRates = result.peerProductivityPatterns.map(
      (p) => p.averageProductivityRate,
    );
    const uniqueProductivityRates = new Set(productivityRates);
    expect(uniqueProductivityRates.size).toBeGreaterThanOrEqual(3);

    result.peerProductivityPatterns.forEach((pattern) => {
      expect(pattern).toHaveProperty('patternName');
      expect(pattern).toHaveProperty('description');
      expect(pattern).toHaveProperty('averageProductivityRate');
      expect(pattern).toHaveProperty('strengthWorkTypes');
      expect(typeof pattern.patternName).toBe('string');
      expect(typeof pattern.description).toBe('string');
      expect(typeof pattern.averageProductivityRate).toBe('number');
      expect(Array.isArray(pattern.strengthWorkTypes)).toBe(true);
      expect(pattern.strengthWorkTypes.length).toBeGreaterThan(0);
    });

    expect(typeof result.estimatedProficiencyDays).toBe('number');
    expect(result.estimatedProficiencyDays).toBeGreaterThan(0);
    expect(Number.isInteger(result.estimatedProficiencyDays)).toBe(true);

    expect(result.approverNotificationStatus).toBe('sent');
    expect(result.errorDetails).toBeNull();

    expect(typeof result.executionTimestamp).toBe('string');
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');
  });

  test('should call all required AI client methods in correct order', async () => {
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'NEW-001',
      jobClassification: 'ピッキング',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2025-01-15T00:00:00Z',
      executingUserId: 'ADMIN-001',
      historicalDataLookbackDays: 90,
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns,
      saveInitialAssignment: mockSaveInitialAssignment,
      sendNotificationToAdministrator: mockSendNotificationToAdministrator,
    };

    await runTx5Imp1Agent(input, aiClient);

    expect(mockAuthenticateUser).toHaveBeenCalledWith('ADMIN-001');
    expect(mockAuthorizeUserAction).toHaveBeenCalledWith('ADMIN-001', 'PLACEMENT_GENERATION');
    expect(mockValidateInputData).toHaveBeenCalledWith(expect.any(Object));
    expect(mockFindWorkersByClassificationAndSite).toHaveBeenCalledWith('ピッキング', 'SITE-001');
    expect(mockFindProductivityDataByWorkerIds).toHaveBeenCalled();
    expect(mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns).toHaveBeenCalled();
    expect(mockSaveInitialAssignment).toHaveBeenCalled();
    expect(mockSendNotificationToAdministrator).toHaveBeenCalled();
  });

  test('should contain distinct patterns with different characteristics', async () => {
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'NEW-001',
      jobClassification: 'ピッキング',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2025-01-15T00:00:00Z',
      executingUserId: 'ADMIN-001',
      historicalDataLookbackDays: 90,
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContextAndExtractPeerPerformancePatterns,
      saveInitialAssignment: mockSaveInitialAssignment,
      sendNotificationToAdministrator: mockSendNotificationToAdministrator,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    const patterns = result.peerProductivityPatterns;
    expect(patterns.length).toBeGreaterThanOrEqual(3);

    const patternDescriptions = new Map<string, { rate: number; types: string[] }>();
    patterns.forEach((pattern) => {
      patternDescriptions.set(pattern.patternName, {
        rate: pattern.averageProductivityRate,
        types: pattern.strengthWorkTypes,
      });
    });

    const rates = Array.from(patternDescriptions.values()).map((p) => p.rate);
    const uniqueRates = new Set(rates);
    expect(uniqueRates.size).toBeGreaterThanOrEqual(2);
  });
});