import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-094: 受注急増を検知して複数チームの進捗を確認し、生産性データを分析して配置案を立案し現場リーダーへ配置指示を配信する', () => {
  const executingUserId = 'user-001';
  const detectionTimestamp = '2024-01-15T10:30:00Z';
  const analysisStartDate = '2024-01-08';
  const analysisEndDate = '2024-01-15';
  const orderDeadlineDate = '2024-01-16';

  const mockProgressData = [
    {
      teamId: 'TEAM-001',
      currentProgressRate: 0.65,
      delayRiskScore: 0.72,
    },
    {
      teamId: 'TEAM-002',
      currentProgressRate: 0.58,
      delayRiskScore: 0.85,
    },
    {
      teamId: 'TEAM-003',
      currentProgressRate: 0.62,
      delayRiskScore: 0.78,
    },
  ];

  const mockProductivityPatterns = [
    {
      workerId: 'WORKER-001',
      averageProductivityRate: 0.88,
      workTypeStrengths: ['assembly', 'packaging'],
    },
    {
      workerId: 'WORKER-002',
      averageProductivityRate: 0.75,
      workTypeStrengths: ['inspection', 'quality_check'],
    },
  ];

  const mockPlacementChanges = [
    {
      workerId: 'WORKER-001',
      currentTeamId: 'TEAM-001',
      proposedTeamId: 'TEAM-002',
      proposedDepartmentId: 'DEPT-001',
      expectedProductivityImprovement: 0.12,
      skillMatchScore: 0.92,
    },
    {
      workerId: 'WORKER-002',
      currentTeamId: 'TEAM-003',
      proposedTeamId: 'TEAM-001',
      proposedDepartmentId: 'DEPT-002',
      expectedProductivityImprovement: 0.08,
      skillMatchScore: 0.85,
    },
  ];

  const mockNotifications = [
    {
      recipientType: 'administrator' as const,
      recipientId: 'admin-001',
      notificationType: 'PLACEMENT_PROPOSAL_GENERATED',
      timestamp: '2024-01-15T10:35:00Z',
    },
    {
      recipientType: 'field_leader' as const,
      recipientId: 'leader-A',
      notificationType: 'PLACEMENT_INSTRUCTION_DELIVERED',
      timestamp: '2024-01-15T10:36:00Z',
    },
    {
      recipientType: 'field_leader' as const,
      recipientId: 'leader-B',
      notificationType: 'PLACEMENT_INSTRUCTION_DELIVERED',
      timestamp: '2024-01-15T10:36:30Z',
    },
  ];

  test('受注急増検知から配置指示配信まで完全に成功する', async () => {
    const input = {
      orderVolumeIncreaseContext: {
        detectionTimestamp,
        orderVolumePercentageIncrease: 45,
        affectedTeamIds: ['TEAM-001', 'TEAM-002', 'TEAM-003'],
        affectedSiteIds: ['SITE-A', 'SITE-B'],
        orderDeadlineDate,
      },
      analysisStartDate,
      analysisEndDate,
      executingUserId,
      dataRetrievalTimeoutMs: 30000,
      useCachedDataIfRetrievalFails: true,
    };

    // Mock AI client interface methods
    const mockAiClient = {
      monitorProgressAndDetectDelayRisk: jest
        .fn()
        .mockResolvedValue(mockProgressData),
      analyzeBusyPeriodProductivityAndProposePlacement: jest
        .fn()
        .mockResolvedValue({
          productivityPatterns: mockProductivityPatterns,
          proposedChanges: mockPlacementChanges,
        }),
      verifyAndScoreAnalysisResult: jest.fn().mockResolvedValue({
        validityScore: 0.87,
        validityReason:
          'All proposed placements align with team load balancing and worker skill compatibility.',
      }),
      executePlacementChangeWithApproval: jest
        .fn()
        .mockResolvedValue({ approved: true }),
      deliverPlacementInstructionToFieldLeader: jest
        .fn()
        .mockResolvedValue({ status: 'delivered' }),
      sendNotificationToAdministrator: jest
        .fn()
        .mockResolvedValue({ sent: true }),
    };

    const result = await runTx6Imp1Agent(input, mockAiClient);

    // Assertion 1: executionStatus is 'success'
    expect(result.executionStatus).toBe('success');

    // Assertion 2: placementProposalId is valid UUID and not null
    expect(result.placementProposalId).toBeTruthy();
    expect(typeof result.placementProposalId).toBe('string');
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        result.placementProposalId || ''
      )
    ).toBe(true);

    // Assertion 3: proposedPlacementChanges is array with valid elements
    expect(Array.isArray(result.proposedPlacementChanges)).toBe(true);
    expect(result.proposedPlacementChanges.length).toBeGreaterThan(0);
    result.proposedPlacementChanges.forEach((change) => {
      expect(change.workerId).toBeTruthy();
      expect(change.currentTeamId).toBeTruthy();
      expect(change.proposedTeamId).toBeTruthy();
      expect(change.proposedDepartmentId).toBeTruthy();
      expect(typeof change.expectedProductivityImprovement).toBe('number');
      expect(change.expectedProductivityImprovement).toBeGreaterThanOrEqual(0);
      expect(change.expectedProductivityImprovement).toBeLessThanOrEqual(1);
      expect(typeof change.skillMatchScore).toBe('number');
      expect(change.skillMatchScore).toBeGreaterThanOrEqual(0);
      expect(change.skillMatchScore).toBeLessThanOrEqual(1);
    });

    // Assertion 4: multiTeamProgressData includes all three teams
    expect(Array.isArray(result.analysisResult.multiTeamProgressData)).toBe(
      true
    );
    const teamIds = result.analysisResult.multiTeamProgressData.map(
      (t) => t.teamId
    );
    expect(teamIds).toContain('TEAM-001');
    expect(teamIds).toContain('TEAM-002');
    expect(teamIds).toContain('TEAM-003');
    result.analysisResult.multiTeamProgressData.forEach((data) => {
      expect(data.teamId).toBeTruthy();
      expect(typeof data.currentProgressRate).toBe('number');
      expect(typeof data.delayRiskScore).toBe('number');
    });

    // Assertion 5: productivityPatternsByWorker is array with valid elements
    expect(Array.isArray(result.analysisResult.productivityPatternsByWorker)).toBe(
      true
    );
    result.analysisResult.productivityPatternsByWorker.forEach((pattern) => {
      expect(pattern.workerId).toBeTruthy();
      expect(typeof pattern.averageProductivityRate).toBe('number');
      expect(Array.isArray(pattern.workTypeStrengths)).toBe(true);
    });

    // Assertion 6: placementValidityScore >= 0.85
    expect(result.analysisResult.placementValidityScore).toBeGreaterThanOrEqual(
      0.85
    );

    // Assertion 7: placementValidityReason contains explanation
    expect(result.analysisResult.placementValidityReason).toBeTruthy();
    expect(typeof result.analysisResult.placementValidityReason).toBe('string');
    expect(
      result.analysisResult.placementValidityReason.length
    ).toBeGreaterThan(0);

    // Assertion 8: deliveryInstructionStatus is 'delivered'
    expect(result.deliveryInstructionStatus).toBe('delivered');

    // Assertion 9: notificationsSent includes administrator and field_leaders
    expect(Array.isArray(result.notificationsSent)).toBe(true);
    expect(result.notificationsSent.length).toBeGreaterThan(0);

    const administratorNotifications = result.notificationsSent.filter(
      (n) => n.recipientType === 'administrator'
    );
    expect(administratorNotifications.length).toBeGreaterThan(0);

    const fieldLeaderNotifications = result.notificationsSent.filter(
      (n) => n.recipientType === 'field_leader'
    );
    expect(fieldLeaderNotifications.length).toBeGreaterThan(0);

    result.notificationsSent.forEach((notification) => {
      expect(notification.recipientId).toBeTruthy();
      expect(notification.notificationType).toBeTruthy();
      expect(notification.timestamp).toBeTruthy();
    });

    // Assertion 10: executionTimestamp is valid ISO 8601
    expect(result.executionTimestamp).toBeTruthy();
    expect(() => new Date(result.executionTimestamp)).not.toThrow();

    // Assertion 11: errorDetails is null
    expect(result.errorDetails).toBeNull();
  });
});