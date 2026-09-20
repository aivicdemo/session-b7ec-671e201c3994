import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-007: WorkExecutionRecordingFailure error handling', () => {
  it('should return failed status when work execution recording fails after placement instruction delivery', async () => {
    const input = {
      executingUserId: 'admin-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: ['site-001', 'site-002'],
      targetTeamIds: ['team-001'],
    };

    const mockAiClient = {
      authorizeUserAction: jest.fn().mockResolvedValue({
        authorized: true,
        userRole: 'admin',
      }),
      monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue({
        delayRiskDetected: true,
        qualityVarianceDetected: true,
        affectedSiteIds: ['site-001', 'site-002'],
        riskScore: 75,
      }),
      aggregatePerformanceDataByPeriod: jest.fn().mockResolvedValue({
        sitePerformanceData: [
          {
            siteId: 'site-001',
            teamId: 'team-001',
            productivityRate: 85,
            qualityScore: 88,
          },
          {
            siteId: 'site-002',
            teamId: 'team-001',
            productivityRate: 92,
            qualityScore: 92,
          },
        ],
      }),
      judgePersonnelReallocationFeasibility: jest.fn().mockResolvedValue({
        feasible: true,
        availableWorkers: ['worker-001', 'worker-002'],
        constraints: [],
      }),
      assessDeliveryRiskAndProposeAdjustments: jest.fn().mockResolvedValue({
        proposalId: 'proposal-001',
        proposedPlacementAdjustments: [
          {
            workerId: 'worker-001',
            fromSiteId: 'site-001',
            toSiteId: 'site-002',
            expectedProductivityGain: 15,
          },
        ],
      }),
      deliverPlacementInstructionToFieldLeader: jest.fn().mockResolvedValue({
        deliveryStatus: 'delivered',
        instructionIds: ['instr-001'],
        timestamp: new Date().toISOString(),
      }),
      recordWorkExecutionStart: jest
        .fn()
        .mockRejectedValue(
          new Error(
            'WorkExecutionRecordingFailure: 作業開始の記録に失敗しました。手動確認が必要です。'
          )
        ),
    };

    const result = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failed');
    expect(result.delayRiskDetected).toBe(true);
    expect(result.qualityVarianceDetected).toBe(true);
    expect(result.affectedSiteIds).toEqual(['site-001', 'site-002']);
    expect(result.placementProposalId).toBe('proposal-001');
    expect(result.placementInstructionDeliveryStatus).toBe('delivered');
    expect(result.workExecutionRecordIds).toEqual([]);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.code).toBe('WorkExecutionRecordingFailure');
    expect(result.errorDetails?.message).toContain(
      '作業開始の記録に失敗しました'
    );
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});