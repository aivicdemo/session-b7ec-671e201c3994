import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-012: 遅延リスク検知の閾値がデフォルト値で適用される', () => {
  it('delayRiskThreshold パラメータが指定されない場合、デフォルト値 70 が適用され、遅延リスク検知と配置指示配信が完結する', async () => {
    const executingUserId = 'admin001';
    
    const input = {
      executingUserId,
      monitoringIntervalSeconds: undefined,
      delayRiskThreshold: undefined,
      qualityVarianceThreshold: undefined,
      targetSiteIds: undefined,
      targetTeamIds: undefined,
    };

    const output = await runTx1Imp1Agent(input, {
      authorizeUserAction: async (userId: string) => {
        return {
          authorized: true,
          role: 'admin',
          userId,
        };
      },
      aggregatePerformanceDataByPeriod: async () => {
        return {
          sites: [
            {
              siteId: 'site-001',
              teamId: 'team-001',
              progressRate: 45,
              plannedProgressRate: 65,
              plannedQuantity: 100,
              actualQuantity: 45,
            },
          ],
        };
      },
      monitorProgressAndDetectDelayRisk: async (params: any) => {
        expect(params.delayRiskThreshold).toBe(70);
        return {
          delayRiskDetected: true,
          affectedSiteIds: ['site-001'],
          delayScore: 85,
          detectionTimestamp: new Date().toISOString(),
        };
      },
      detectQualityVariance: async () => {
        return {
          qualityVarianceDetected: false,
          affectedSiteIds: [],
        };
      },
      generatePlacementProposal: async () => {
        return {
          placementProposalId: 'proposal-001',
          proposedSiteIds: ['site-001'],
          expectedImpact: 'delay_mitigation',
        };
      },
      deliverPlacementInstruction: async () => {
        return {
          deliveryStatus: 'delivered',
          workExecutionRecordIds: ['record-001'],
        };
      },
    });

    expect(output.executionStatus).toBe('completed');
    expect(output.delayRiskDetected).toBe(true);
    expect(output.qualityVarianceDetected).toBe(false);
    expect(output.affectedSiteIds).toContain('site-001');
    expect(output.placementProposalId).not.toBeNull();
    expect(output.placementInstructionDeliveryStatus).toBe('delivered');
    expect(output.workExecutionRecordIds).toHaveLength(1);
    expect(output.errorDetails).toBeNull();
    expect(output.executionTimestamp).toBeDefined();
  });
});