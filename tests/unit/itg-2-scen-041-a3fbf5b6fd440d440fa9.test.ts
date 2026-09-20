import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-041: リアルタイム監視トリガーで指定の監視間隔と対象拠点IDで実行される場合', () => {
  it('該当拠点のみの監視と配置案生成が行われる', async () => {
    const targetSiteIds = ['site-A', 'site-B'];
    const executingUserId = 'user-001';
    const monitoringIntervalSeconds = 300;
    const delayRiskThreshold = 70;

    const mockDelayRisks = [
      {
        siteId: 'site-A',
        riskScore: 75,
        progressRate: 45,
        remainingTimeHours: 24,
        detectionTimestamp: new Date().toISOString(),
      },
      {
        siteId: 'site-B',
        riskScore: 72,
        progressRate: 50,
        remainingTimeHours: 30,
        detectionTimestamp: new Date().toISOString(),
      },
    ];

    const mockAffectedSites = [
      {
        siteId: 'site-A',
        siteName: 'Site A',
        requiredAdjustments: ['increase_team_capacity'],
        currentTeamCapacity: 60,
        requiredCapacityIncrease: 20,
      },
      {
        siteId: 'site-B',
        siteName: 'Site B',
        requiredAdjustments: ['reallocate_workers'],
        currentTeamCapacity: 65,
        requiredCapacityIncrease: 15,
      },
    ];

    const mockPlacementProposals = [
      {
        proposalId: 'proposal-1',
        targetSiteId: 'site-A',
        workerReallocationPlan: [
          {
            workerId: 'worker-1',
            workerName: 'Worker One',
            sourceSiteId: 'site-C',
            targetSiteId: 'site-A',
            assignedWorkType: 'assembly',
            skillMatchScore: 85,
            estimatedProductivityAtTarget: 80,
          },
        ],
        expectedProductivityImprovement: 15,
        estimatedDeliveryRiskReduction: 20,
        proposalGeneratedTimestamp: new Date().toISOString(),
      },
      {
        proposalId: 'proposal-2',
        targetSiteId: 'site-B',
        workerReallocationPlan: [
          {
            workerId: 'worker-2',
            workerName: 'Worker Two',
            sourceSiteId: 'site-D',
            targetSiteId: 'site-B',
            assignedWorkType: 'inspection',
            skillMatchScore: 80,
            estimatedProductivityAtTarget: 75,
          },
        ],
        expectedProductivityImprovement: 12,
        estimatedDeliveryRiskReduction: 18,
        proposalGeneratedTimestamp: new Date().toISOString(),
      },
    ];

    const mockDeliveryInstructions = [
      {
        instructionId: 'instr-1',
        fieldLeaderId: 'leader-A',
        targetSiteId: 'site-A',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        acknowledgmentTimestamp: null,
      },
      {
        instructionId: 'instr-2',
        fieldLeaderId: 'leader-B',
        targetSiteId: 'site-B',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        acknowledgmentTimestamp: null,
      },
    ];

    const result = await runTx4Imp1Agent(
      {
        triggerType: 'realtime_monitoring',
        monitoringIntervalSeconds,
        targetSiteIds,
        delayRiskThreshold,
        executingUserId,
        contextData: {},
      },
      {
        authenticateUser: jest.fn().mockResolvedValue({ userId: executingUserId, valid: true }),
        monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue(mockDelayRisks),
        orchestrateDataCollectionForDelayRisk: jest.fn().mockResolvedValue({
          productivityData: [],
          skillMatchData: [],
        }),
        judgePersonnelReallocationFeasibility: jest.fn().mockResolvedValue({
          feasible: true,
          proposals: mockPlacementProposals,
        }),
        assessDeliveryRiskAndProposeAdjustments: jest.fn().mockResolvedValue(mockPlacementProposals),
        deliverPlacementInstructionToFieldLeader: jest.fn().mockResolvedValue(mockDeliveryInstructions),
      }
    );

    expect(result.executionStatus).toBe('success');
    expect(result.detectedDelayRisks).toHaveLength(2);
    expect(result.detectedDelayRisks.map(r => r.siteId)).toEqual(expect.arrayContaining(['site-A', 'site-B']));
    expect(result.detectedDelayRisks).toEqual(expect.arrayContaining(
      mockDelayRisks.map(r => expect.objectContaining({ siteId: r.siteId }))
    ));

    expect(result.affectedSites).toHaveLength(2);
    expect(result.affectedSites.map(s => s.siteId)).toEqual(expect.arrayContaining(['site-A', 'site-B']));
    expect(result.affectedSites.map(s => s.siteId)).not.toContain('site-C');
    expect(result.affectedSites.map(s => s.siteId)).not.toContain('site-D');

    expect(result.placementProposals).toHaveLength(2);
    expect(result.placementProposals.map(p => p.targetSiteId)).toEqual(expect.arrayContaining(['site-A', 'site-B']));
    expect(result.placementProposals.map(p => p.targetSiteId)).not.toContain('site-C');

    expect(result.deliveryInstructions).toHaveLength(2);
    expect(result.deliveryInstructions.map(d => d.targetSiteId)).toEqual(expect.arrayContaining(['site-A', 'site-B']));
    expect(result.deliveryInstructions.map(d => d.targetSiteId)).not.toContain('site-C');

    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.errorDetails).toBeNull();
  });
});