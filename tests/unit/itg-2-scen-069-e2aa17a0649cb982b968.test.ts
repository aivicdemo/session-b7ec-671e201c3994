import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-069: 承認者通知ステータスが pending の場合、成功フラグは true で返却される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success=true with initialAssignmentId when approverNotificationStatus is pending', async () => {
    // Mock dependencies
    const mockAuthenticateUser = jest
      .fn()
      .mockResolvedValue({ userId: 'U001', isAuthenticated: true, role: 'admin' });

    const mockAuthorizeUserAction = jest
      .fn()
      .mockResolvedValue({ authorized: true, permission: 'initial_assignment_generation' });

    const mockValidateInputData = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
    });

    const mockExistingWorkers = [
      { workerId: 'W002', name: 'Worker 2', jobClassification: 'ピッキング' },
      { workerId: 'W003', name: 'Worker 3', jobClassification: 'ピッキング' },
      { workerId: 'W004', name: 'Worker 4', jobClassification: 'ピッキング' },
    ];

    const mockFindWorkersByClassificationAndSite = jest
      .fn()
      .mockResolvedValue(mockExistingWorkers);

    const mockProductivityData = [
      {
        workerId: 'W002',
        dates: [
          {
            date: '2024-01-10',
            completedCount: 120,
            workingMinutes: 480,
            productivityRate: 85,
            qualityScore: 95,
          },
          {
            date: '2024-01-11',
            completedCount: 125,
            workingMinutes: 480,
            productivityRate: 88,
            qualityScore: 96,
          },
        ],
      },
      {
        workerId: 'W003',
        dates: [
          {
            date: '2024-01-10',
            completedCount: 110,
            workingMinutes: 480,
            productivityRate: 78,
            qualityScore: 92,
          },
        ],
      },
      {
        workerId: 'W004',
        dates: [
          {
            date: '2024-01-10',
            completedCount: 130,
            workingMinutes: 480,
            productivityRate: 92,
            qualityScore: 98,
          },
        ],
      },
    ];

    const mockFindProductivityDataByWorkerIds = jest
      .fn()
      .mockResolvedValue(mockProductivityData);

    const mockAnalyzeOnboardingContext = jest.fn().mockResolvedValue({
      proposedWorkTypes: [
        {
          workTypeId: 'WT001',
          workTypeName: 'ピッキング作業',
          recommendationReason: '既存作業者の得意作業として確認',
          expectedProductivityRate: 85,
        },
      ],
      peerProductivityPatterns: [
        {
          patternName: '標準パターン',
          description: '平均的な生産性パターン',
          averageProductivityRate: 85,
          strengthWorkTypes: ['ピッキング作業'],
        },
      ],
      estimatedProficiencyDays: 14,
    });

    const mockSaveInitialAssignment = jest.fn().mockResolvedValue({
      initialAssignmentId: 'IA001',
      success: true,
    });

    const mockSendNotificationToAdministrator = jest.fn().mockResolvedValue({
      approverNotificationStatus: 'pending',
    });

    // Setup global mocks or inject dependencies
    global.authenticateUser = mockAuthenticateUser;
    global.authorizeUserAction = mockAuthorizeUserAction;
    global.validateInputData = mockValidateInputData;
    global.findWorkersByClassificationAndSite = mockFindWorkersByClassificationAndSite;
    global.findProductivityDataByWorkerIds = mockFindProductivityDataByWorkerIds;
    global.analyzeOnboardingContextAndExtractPeerPerformancePatterns =
      mockAnalyzeOnboardingContext;
    global.saveInitialAssignment = mockSaveInitialAssignment;
    global.sendNotificationToAdministrator = mockSendNotificationToAdministrator;

    // Call the function
    const result = await runTx5Imp1Agent(
      {
        newAssigneeWorkerId: 'W001',
        jobClassification: 'ピッキング',
        assignedSiteId: 'S001',
        assignedTeamId: 'T001',
        assignedDepartmentId: 'D001',
        assignmentStartDate: '2024-01-15T00:00:00Z',
        executingUserId: 'U001',
        historicalDataLookbackDays: 90,
      },
      {
        authenticateUser: mockAuthenticateUser,
        authorizeUserAction: mockAuthorizeUserAction,
        validateInputData: mockValidateInputData,
        findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
        findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
        analyzeOnboardingContextAndExtractPeerPerformancePatterns:
          mockAnalyzeOnboardingContext,
        saveInitialAssignment: mockSaveInitialAssignment,
        sendNotificationToAdministrator: mockSendNotificationToAdministrator,
      }
    );

    // Assertions
    expect(result.success).toBe(true);
    expect(result.initialAssignmentId).toBe('IA001');
    expect(result.initialAssignmentId).not.toBeNull();

    expect(result.proposedWorkTypes).toHaveLength(1);
    expect(result.proposedWorkTypes[0]).toHaveProperty('workTypeId');
    expect(result.proposedWorkTypes[0]).toHaveProperty('workTypeName');
    expect(result.proposedWorkTypes[0]).toHaveProperty('recommendationReason');
    expect(result.proposedWorkTypes[0]).toHaveProperty('expectedProductivityRate');

    expect(result.peerProductivityPatterns).toHaveLength(1);
    expect(result.peerProductivityPatterns[0]).toHaveProperty('patternName');
    expect(result.peerProductivityPatterns[0]).toHaveProperty('description');
    expect(result.peerProductivityPatterns[0]).toHaveProperty('averageProductivityRate');
    expect(result.peerProductivityPatterns[0]).toHaveProperty('strengthWorkTypes');

    expect(result.estimatedProficiencyDays).toBeGreaterThan(0);
    expect(Number.isInteger(result.estimatedProficiencyDays)).toBe(true);

    expect(result.approverNotificationStatus).toBe('pending');
    expect(result.errorDetails).toBeNull();

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.executionTimestamp)).toBe(true);

    // Verify mock calls
    expect(mockAuthenticateUser).toHaveBeenCalledWith('U001');
    expect(mockAuthorizeUserAction).toHaveBeenCalledWith('U001', 'initial_assignment_generation');
    expect(mockValidateInputData).toHaveBeenCalled();
    expect(mockFindWorkersByClassificationAndSite).toHaveBeenCalledWith(
      'ピッキング',
      'S001'
    );
    expect(mockFindProductivityDataByWorkerIds).toHaveBeenCalled();
    expect(mockAnalyzeOnboardingContext).toHaveBeenCalled();
    expect(mockSaveInitialAssignment).toHaveBeenCalled();
    expect(mockSendNotificationToAdministrator).toHaveBeenCalled();
  });
});