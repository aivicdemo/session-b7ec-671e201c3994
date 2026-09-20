import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-005: PlacementProposalGenerationFailure Error Handling', () => {
  let mockAuthorizeUserAction: jest.Mock;
  let mockMonitorProgressAndDetectDelayRisk: jest.Mock;
  let mockAggregatePerformanceDataByPeriod: jest.Mock;
  let mockJudgePersonnelReallocationFeasibility: jest.Mock;
  let mockAssessDeliveryRiskAndProposeAdjustments: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeUserAction = jest.fn().mockResolvedValue({ authorized: true });
    mockMonitorProgressAndDetectDelayRisk = jest.fn().mockResolvedValue({
      delayRiskDetected: true,
      qualityVarianceDetected: true,
      affectedSiteIds: ['SITE-001', 'SITE-002'],
    });
    mockAggregatePerformanceDataByPeriod = jest.fn().mockResolvedValue({
      aggregatedData: {
        'SITE-001': { performance: 80, targetPerformance: 90 },
        'SITE-002': { performance: 75, targetPerformance: 90 },
      },
    });
    mockJudgePersonnelReallocationFeasibility = jest.fn().mockResolvedValue({
      feasible: true,
      recommendation: 'reallocation_required',
    });
    mockAssessDeliveryRiskAndProposeAdjustments = jest
      .fn()
      .mockRejectedValue(
        new Error(
          'PlacementProposalGenerationFailure: 配置案の生成に失敗しました。システム管理者に報告してください。'
        )
      );
  });

  it('should return PlacementProposalGenerationFailure error when placement proposal generation fails', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUserAction,
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceDataByPeriod,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
    };

    const output = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(output.executionStatus).toBe('failed');
    expect(output.delayRiskDetected).toBe(true);
    expect(output.qualityVarianceDetected).toBe(true);
    expect(output.affectedSiteIds).toEqual(['SITE-001', 'SITE-002']);
    expect(output.placementProposalId).toBeNull();
    expect(output.workExecutionRecordIds).toEqual([]);
    expect(['failed', 'pending']).toContain(output.placementInstructionDeliveryStatus);

    expect(output.errorDetails).not.toBeNull();
    expect(output.errorDetails?.code).toBe('PlacementProposalGenerationFailure');
    expect(output.errorDetails?.message).toBe('配置案の生成に失敗しました。システム管理者に報告してください。');
    expect(output.errorDetails?.affectedResourceIds).toEqual(['SITE-001', 'SITE-002']);
  });

  it('should call authorize user action with admin user ID', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUserAction,
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceDataByPeriod,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
    };

    await runTx1Imp1Agent(input, mockAiClient as any);

    expect(mockAuthorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-001',
      })
    );
  });

  it('should detect delay risk and quality variance before proposing placement', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUserAction,
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceDataByPeriod,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
    };

    await runTx1Imp1Agent(input, mockAiClient as any);

    expect(mockMonitorProgressAndDetectDelayRisk).toHaveBeenCalled();
  });

  it('should include affected site IDs in error details', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUserAction,
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceDataByPeriod,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
    };

    const output = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(output.errorDetails).not.toBeNull();
    expect(output.errorDetails?.affectedResourceIds).toEqual(['SITE-001', 'SITE-002']);
  });

  it('should have null placement proposal ID when generation fails', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUserAction,
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceDataByPeriod,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
    };

    const output = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(output.placementProposalId).toBeNull();
  });

  it('should have empty work execution records when placement proposal generation fails', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUserAction,
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      aggregatePerformanceDataByPeriod: mockAggregatePerformanceDataByPeriod,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
    };

    const output = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(output.workExecutionRecordIds).toEqual([]);
    expect(Array.isArray(output.workExecutionRecordIds)).toBe(true);
  });
});