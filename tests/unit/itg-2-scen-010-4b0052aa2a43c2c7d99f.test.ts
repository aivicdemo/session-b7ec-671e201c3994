import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-010: 監視対象チームが指定されないと、全チームが監視対象となる', () => {
  it('targetTeamIdsが空配列の場合、全チームが監視対象となり、複数拠点が結果に含まれる', async () => {
    const executingUserId = 'admin-user-001';
    let monitorProgressCalled = false;
    let assessDeliveryRiskCalled = false;
    
    const input: Tx1Imp1AgentInput = {
      executingUserId,
      targetTeamIds: [],
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeUserAction: async (userId: string) => {
        expect(userId).toBe(executingUserId);
        return { authorized: true, role: 'admin' };
      },
      monitorProgressAndDetectDelayRisk: async (params: any) => {
        monitorProgressCalled = true;
        expect(params.teamFilter === undefined || params.teamFilter === null || (Array.isArray(params.teamFilter) && params.teamFilter.length === 0)).toBe(true);
        return {
          delayRiskDetected: true,
          affectedSiteIds: ['site-001', 'site-002'],
          affectedTeamIds: ['team-A', 'team-B', 'team-C'],
        };
      },
      assessDeliveryRiskAndProposeAdjustments: async (params: any) => {
        assessDeliveryRiskCalled = true;
        expect(params.teamFilter === undefined || params.teamFilter === null || (Array.isArray(params.teamFilter) && params.teamFilter.length === 0)).toBe(true);
        return {
          qualityVarianceDetected: true,
          proposedPlacementId: 'placement-001',
        };
      },
      generateOptimalPlacementProposal: async () => {
        return { proposalId: 'placement-001', confidence: 0.92 };
      },
      validatePlacementFeasibility: async () => {
        return { feasible: true, constraints: [] };
      },
      deliverPlacementInstructions: async () => {
        return { status: 'delivered', recordIds: ['record-001', 'record-002'] };
      },
      recordWorkExecutionStart: async () => {
        return { recordIds: ['exec-001', 'exec-002', 'exec-003'] };
      },
    } as any);

    expect(monitorProgressCalled).toBe(true);
    expect(assessDeliveryRiskCalled).toBe(true);
    expect(output.executionStatus).toMatch(/^(completed|no_action_required|failed)$/);
    expect(Array.isArray(output.affectedSiteIds)).toBe(true);
    expect(output.delayRiskDetected).toBe(true);
    expect(output.qualityVarianceDetected).toBe(true);
    expect(output.placementProposalId).not.toBeNull();
    expect(output.workExecutionRecordIds).toBeInstanceOf(Array);
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('targetTeamIdsが未指定の場合、全チームが監視対象となる', async () => {
    const executingUserId = 'system-admin-002';
    let monitorProgressCalled = false;
    let assessDeliveryRiskCalled = false;
    
    const input: Tx1Imp1AgentInput = {
      executingUserId,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeUserAction: async (userId: string) => {
        expect(userId).toBe(executingUserId);
        return { authorized: true, role: 'system_admin' };
      },
      monitorProgressAndDetectDelayRisk: async (params: any) => {
        monitorProgressCalled = true;
        expect(params.teamFilter === undefined || params.teamFilter === null || (Array.isArray(params.teamFilter) && params.teamFilter.length === 0)).toBe(true);
        return {
          delayRiskDetected: false,
          affectedSiteIds: [],
          affectedTeamIds: [],
        };
      },
      assessDeliveryRiskAndProposeAdjustments: async (params: any) => {
        assessDeliveryRiskCalled = true;
        expect(params.teamFilter === undefined || params.teamFilter === null || (Array.isArray(params.teamFilter) && params.teamFilter.length === 0)).toBe(true);
        return {
          qualityVarianceDetected: false,
          proposedPlacementId: null,
        };
      },
      generateOptimalPlacementProposal: async () => {
        return { proposalId: null, confidence: 0 };
      },
      validatePlacementFeasibility: async () => {
        return { feasible: true, constraints: [] };
      },
      deliverPlacementInstructions: async () => {
        return { status: 'pending', recordIds: [] };
      },
      recordWorkExecutionStart: async () => {
        return { recordIds: [] };
      },
    } as any);

    expect(monitorProgressCalled).toBe(true);
    expect(assessDeliveryRiskCalled).toBe(true);
    expect(output.executionStatus).toBe('no_action_required');
    expect(output.affectedSiteIds).toEqual([]);
    expect(output.delayRiskDetected).toBe(false);
    expect(output.qualityVarianceDetected).toBe(false);
    expect(output.placementProposalId).toBeNull();
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('権限がない場合、エラー状態が返される', async () => {
    const executingUserId = 'unauthorized-user-003';
    
    const input: Tx1Imp1AgentInput = {
      executingUserId,
      targetTeamIds: [],
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeUserAction: async (userId: string) => {
        return { authorized: false, role: null };
      },
      monitorProgressAndDetectDelayRisk: async () => {
        throw new Error('Should not be called');
      },
      assessDeliveryRiskAndProposeAdjustments: async () => {
        throw new Error('Should not be called');
      },
      generateOptimalPlacementProposal: async () => {
        throw new Error('Should not be called');
      },
      validatePlacementFeasibility: async () => {
        throw new Error('Should not be called');
      },
      deliverPlacementInstructions: async () => {
        throw new Error('Should not be called');
      },
      recordWorkExecutionStart: async () => {
        throw new Error('Should not be called');
      },
    } as any);

    expect(output.executionStatus).toBe('failed');
    expect(output.errorDetails).not.toBeNull();
    expect(output.errorDetails?.code).toBe('AUTHORIZATION_FAILED');
  });

  it('複数の拠点とチームが検知された場合、affectedSiteIdsに全て含まれる', async () => {
    const executingUserId = 'admin-user-004';
    const detectedSites = ['site-A', 'site-B', 'site-C', 'site-D'];
    const detectedTeams = ['team-1', 'team-2', 'team-3', 'team-4'];
    let monitorProgressTeamIds: any;
    let assessDeliveryRiskTeamIds: any;
    
    const input: Tx1Imp1AgentInput = {
      executingUserId,
      targetTeamIds: [],
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeUserAction: async () => {
        return { authorized: true, role: 'admin' };
      },
      monitorProgressAndDetectDelayRisk: async (params: any) => {
        monitorProgressTeamIds = params.teamFilter;
        return {
          delayRiskDetected: true,
          affectedSiteIds: detectedSites,
          affectedTeamIds: detectedTeams,
        };
      },
      assessDeliveryRiskAndProposeAdjustments: async (params: any) => {
        assessDeliveryRiskTeamIds = params.teamFilter;
        return {
          qualityVarianceDetected: true,
          proposedPlacementId: 'placement-multi',
        };
      },
      generateOptimalPlacementProposal: async () => {
        return { proposalId: 'placement-multi', confidence: 0.85 };
      },
      validatePlacementFeasibility: async () => {
        return { feasible: true, constraints: [] };
      },
      deliverPlacementInstructions: async () => {
        return { status: 'delivered', recordIds: ['r1', 'r2', 'r3', 'r4'] };
      },
      recordWorkExecutionStart: async () => {
        return { recordIds: ['e1', 'e2', 'e3', 'e4'] };
      },
    } as any);

    expect(monitorProgressTeamIds === undefined || monitorProgressTeamIds === null || (Array.isArray(monitorProgressTeamIds) && monitorProgressTeamIds.length === 0)).toBe(true);
    expect(assessDeliveryRiskTeamIds === undefined || assessDeliveryRiskTeamIds === null || (Array.isArray(assessDeliveryRiskTeamIds) && assessDeliveryRiskTeamIds.length === 0)).toBe(true);
    expect(output.affectedSiteIds).toEqual(detectedSites);
    expect(output.affectedSiteIds.length).toBe(4);
    expect(output.delayRiskDetected).toBe(true);
    expect(output.qualityVarianceDetected).toBe(true);
  });

  it('executionTimestampはISO 8601形式で記録される', async () => {
    const executingUserId = 'admin-user-005';
    
    const input: Tx1Imp1AgentInput = {
      executingUserId,
      targetTeamIds: [],
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeUserAction: async () => {
        return { authorized: true, role: 'admin' };
      },
      monitorProgressAndDetectDelayRisk: async () => {
        return {
          delayRiskDetected: false,
          affectedSiteIds: [],
          affectedTeamIds: [],
        };
      },
      assessDeliveryRiskAndProposeAdjustments: async () => {
        return {
          qualityVarianceDetected: false,
          proposedPlacementId: null,
        };
      },
      generateOptimalPlacementProposal: async () => {
        return { proposalId: null, confidence: 0 };
      },
      validatePlacementFeasibility: async () => {
        return { feasible: true, constraints: [] };
      },
      deliverPlacementInstructions: async () => {
        return { status: 'pending', recordIds: [] };
      },
      recordWorkExecutionStart: async () => {
        return { recordIds: [] };
      },
    } as any);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(output.executionTimestamp).toMatch(iso8601Regex);
  });
});