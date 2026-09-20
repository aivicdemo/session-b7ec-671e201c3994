import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-071: InitialAssignmentGenerationFailureError when proposedWorkTypes is empty', () => {
  it('should return failure output with InitialAssignmentGenerationFailureError when proposedWorkTypes array is empty', async () => {
    const input = {
      newAssigneeWorkerId: 'worker-new-001',
      jobClassification: 'assembly-technician',
      assignedSiteId: 'site-001',
      assignedTeamId: 'team-001',
      assignedDepartmentId: 'dept-001',
      assignmentStartDate: '2024-01-15T00:00:00Z',
      executingUserId: 'admin-user-001',
      historicalDataLookbackDays: 90,
    };

    const authorizeUserActionMock = jest.fn().mockResolvedValue(true);
    const validateInputDataMock = jest.fn().mockResolvedValue(true);
    const findWorkersByClassificationAndSiteMock = jest.fn().mockResolvedValue([
      { workerId: 'worker-existing-001', jobClassification: 'assembly-technician' },
      { workerId: 'worker-existing-002', jobClassification: 'assembly-technician' },
    ]);
    const findProductivityDataByWorkerIdsMock = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-existing-001',
        workDate: '2023-10-15T00:00:00Z',
        productivityRate: 85,
        workTypeId: 'worktype-001',
      },
      {
        workerId: 'worker-existing-002',
        workDate: '2023-10-16T00:00:00Z',
        productivityRate: 78,
        workTypeId: 'worktype-002',
      },
    ]);

    const analyzeOnboardingContextAndExtractPeerPerformancePatternsMock = jest
      .fn()
      .mockResolvedValue({
        peerProductivityPatterns: [
          {
            patternName: 'Pattern A',
            description: 'High consistency pattern',
            averageProductivityRate: 82,
            strengthWorkTypes: [],
          },
        ],
        recommendedWorkTypes: [],
      });

    const saveInitialAssignmentMock = jest.fn();
    const sendNotificationToAdministratorMock = jest.fn();

    const result = await runTx5Imp1Agent(input, {
      authorizeUserAction: authorizeUserActionMock,
      validateInputData: validateInputDataMock,
      findWorkersByClassificationAndSite: findWorkersByClassificationAndSiteMock,
      findProductivityDataByWorkerIds: findProductivityDataByWorkerIdsMock,
      retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        analyzeOnboardingContextAndExtractPeerPerformancePatternsMock,
      saveInitialAssignment: saveInitialAssignmentMock,
      sendNotificationToAdministrator: sendNotificationToAdministratorMock,
    } as any);

    expect(authorizeUserActionMock).toHaveBeenCalledWith(input.executingUserId);
    expect(validateInputDataMock).toHaveBeenCalledWith(input);
    expect(findWorkersByClassificationAndSiteMock).toHaveBeenCalledWith(
      input.jobClassification,
      input.assignedSiteId
    );
    expect(findProductivityDataByWorkerIdsMock).toHaveBeenCalled();
    expect(analyzeOnboardingContextAndExtractPeerPerformancePatternsMock).toHaveBeenCalled();

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.proposedWorkTypes).toEqual([]);
    expect(result.errorDetails).toBe(
      '初期割当案の生成に失敗しました。入力データと分析ロジックを確認してください。'
    );
    expect(result.approverNotificationStatus).toBe('failed');
    expect(result.executionTimestamp).toBeDefined();

    expect(saveInitialAssignmentMock).not.toHaveBeenCalled();
    expect(sendNotificationToAdministratorMock).not.toHaveBeenCalled();
  });
});