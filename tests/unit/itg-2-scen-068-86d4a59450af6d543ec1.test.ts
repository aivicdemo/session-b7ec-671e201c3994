import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-068: 初期割当案生成と承認者通知', () => {
  it('承認者通知ステータスが\'sent\'の場合、成功フラグはtrueで返却される', async () => {
    // Arrange
    const executingUserId = 'user-admin-001';
    const newAssigneeWorkerId = 'worker-new-001';
    const jobClassification = 'assembly-A';
    const assignedSiteId = 'site-tokyo-001';
    const assignedTeamId = 'team-tokyo-assembly-01';
    const assignedDepartmentId = 'dept-manufacturing-001';
    const assignmentStartDate = '2024-01-15T00:00:00Z';
    const historicalDataLookbackDays = 90;

    const input = {
      newAssigneeWorkerId,
      jobClassification,
      assignedSiteId,
      assignedTeamId,
      assignedDepartmentId,
      assignmentStartDate,
      executingUserId,
      historicalDataLookbackDays,
    };

    // Act
    const result = await runTx5Imp1Agent(input, {
      authenticateUser: async (userId: string) => ({ success: true, userId }),
      authorizeUserAction: async (userId: string, action: string) => ({ authorized: true }),
      validateInputData: async (data: any) => ({ valid: true, errors: [] }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async (data: any) => ({
        context: {
          newAssigneeId: data.newAssigneeWorkerId,
          jobClassification: data.jobClassification,
          assignedSiteId: data.assignedSiteId,
        },
      }),
      findWorkersByClassificationAndSite: async (classification: string, siteId: string) => [
        { workerId: 'worker-peer-001', name: 'John Doe' },
        { workerId: 'worker-peer-002', name: 'Jane Smith' },
      ],
      findProductivityDataByWorkerIds: async (workerIds: string[], lookbackDays: number) => [
        {
          workerId: 'worker-peer-001',
          workTypeId: 'wt-assembly-001',
          workTypeName: 'Assembly Line A',
          avgProductivityRate: 92,
          completedTasksCount: 150,
          periodDays: 90,
        },
        {
          workerId: 'worker-peer-002',
          workTypeId: 'wt-assembly-001',
          workTypeName: 'Assembly Line A',
          avgProductivityRate: 88,
          completedTasksCount: 140,
          periodDays: 90,
        },
      ],
      saveInitialAssignment: async (assignmentData: any) => ({
        initialAssignmentId: 'assign-001-new',
        status: 'pending_approval',
      }),
      sendNotificationToAdministrator: async (assignmentId: string, administratorInfo: any) => ({
        approverNotificationStatus: 'sent',
        notificationId: 'notif-001',
        sentTimestamp: new Date().toISOString(),
      }),
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.approverNotificationStatus).toBe('sent');
    expect(result.initialAssignmentId).not.toBeNull();
    expect(result.initialAssignmentId).toBeTruthy();
    expect(typeof result.initialAssignmentId).toBe('string');
    
    expect(result.proposedWorkTypes).toBeDefined();
    expect(Array.isArray(result.proposedWorkTypes)).toBe(true);
    expect(result.proposedWorkTypes.length).toBeGreaterThanOrEqual(1);
    result.proposedWorkTypes.forEach((workType) => {
      expect(workType).toHaveProperty('workTypeId');
      expect(workType).toHaveProperty('workTypeName');
      expect(workType).toHaveProperty('recommendationReason');
      expect(workType).toHaveProperty('expectedProductivityRate');
      expect(typeof workType.workTypeId).toBe('string');
      expect(typeof workType.workTypeName).toBe('string');
      expect(typeof workType.recommendationReason).toBe('string');
      expect(typeof workType.expectedProductivityRate).toBe('number');
    });

    expect(result.peerProductivityPatterns).toBeDefined();
    expect(Array.isArray(result.peerProductivityPatterns)).toBe(true);
    result.peerProductivityPatterns.forEach((pattern) => {
      expect(pattern).toHaveProperty('patternName');
      expect(pattern).toHaveProperty('description');
      expect(pattern).toHaveProperty('averageProductivityRate');
      expect(pattern).toHaveProperty('strengthWorkTypes');
      expect(typeof pattern.patternName).toBe('string');
      expect(typeof pattern.description).toBe('string');
      expect(typeof pattern.averageProductivityRate).toBe('number');
      expect(Array.isArray(pattern.strengthWorkTypes)).toBe(true);
    });

    expect(result.estimatedProficiencyDays).toBeDefined();
    expect(typeof result.estimatedProficiencyDays).toBe('number');
    expect(result.estimatedProficiencyDays).toBeGreaterThan(0);

    expect(result.errorDetails).toBeNull();

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    expect(() => new Date(result.executionTimestamp)).not.toThrow();
  });
});