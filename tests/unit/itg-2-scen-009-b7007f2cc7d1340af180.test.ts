import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-009: 監視対象拠点が指定されないと、全拠点が監視対象となる', () => {
  const allSiteIds = ['site-001', 'site-002', 'site-003'];
  const allTeamIds = ['team-001', 'team-002', 'team-003'];

  let mockAuthorizeUser: jest.Mock;
  let mockMonitorProgress: jest.Mock;
  let mockAggregatePerformance: jest.Mock;
  let mockAssessRisk: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeUser = jest.fn().mockResolvedValue({
      authorized: true,
    });

    mockMonitorProgress = jest.fn().mockResolvedValue({
      delayRiskDetected: false,
      affectedSites: allSiteIds,
    });

    mockAggregatePerformance = jest.fn().mockResolvedValue({
      performanceData: [],
    });

    mockAssessRisk = jest.fn().mockResolvedValue({
      riskAssessment: [],
      affectedSiteIds: allSiteIds,
    });
  });

  test('authorizeUserAction を呼び出してエージェント実行ユーザーの権限を検証し、実行権限ありの状態を確認する', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-user-001',
      targetSiteIds: [],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      aggregatePerformanceDataByPeriod: mockAggregatePerformance,
      assessDeliveryRiskAndProposeAdjustments: mockAssessRisk,
    };

    const result = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(mockAuthorizeUser).toHaveBeenCalled();
    expect(mockAuthorizeUser).toHaveBeenCalledWith(
      expect.objectContaining({
        executingUserId: 'admin-user-001',
      })
    );
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('completed');
  });

  test('targetSiteIds と targetTeamIds が空配列の場合、全拠点・全チームが監視対象となる', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-user-001',
      targetSiteIds: [],
      targetTeamIds: [],
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      aggregatePerformanceDataByPeriod: mockAggregatePerformance,
      assessDeliveryRiskAndProposeAdjustments: mockAssessRisk,
    };

    const result = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(result.affectedSiteIds).toEqual(allSiteIds);
    expect(result.executionStatus).toBe('completed');
  });

  test('targetSiteIds と targetTeamIds が未指定（undefined）の場合、全拠点・全チームが監視対象となる', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-user-002',
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      aggregatePerformanceDataByPeriod: mockAggregatePerformance,
      assessDeliveryRiskAndProposeAdjustments: mockAssessRisk,
    };

    const result = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(result.affectedSiteIds).toEqual(allSiteIds);
    expect(result.executionStatus).toBe('completed');
  });

  test('monitorProgressAndDetectDelayRisk のスタブが、全拠点のデータを対象として呼び出されたことを検証する', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-user-003',
      targetSiteIds: [],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      aggregatePerformanceDataByPeriod: mockAggregatePerformance,
      assessDeliveryRiskAndProposeAdjustments: mockAssessRisk,
    };

    await runTx1Imp1Agent(input, mockAiClient as any);

    expect(mockMonitorProgress).toHaveBeenCalled();
    const callArgs = mockMonitorProgress.mock.calls[0][0];
    expect(callArgs.targetSiteIds).toBeDefined();
    expect(Array.isArray(callArgs.targetSiteIds)).toBe(true);
    expect(callArgs.targetSiteIds.length).toBeGreaterThan(0);
    expect(callArgs.targetSiteIds).toEqual(expect.arrayContaining(allSiteIds));
    // 対象限定フィルタなし（全拠点のデータを対象）で呼び出されたことを確認
    expect(callArgs).not.toHaveProperty('siteFilter');
    expect(callArgs).toEqual(expect.objectContaining({
      targetSiteIds: allSiteIds,
    }));
  });

  test('aggregatePerformanceDataByPeriod のスタブが、全チームのデータを対象として呼び出されたことを検証する', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-user-004',
      targetSiteIds: [],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      aggregatePerformanceDataByPeriod: mockAggregatePerformance,
      assessDeliveryRiskAndProposeAdjustments: mockAssessRisk,
    };

    await runTx1Imp1Agent(input, mockAiClient as any);

    expect(mockAggregatePerformance).toHaveBeenCalled();
    const callArgs = mockAggregatePerformance.mock.calls[0][0];
    expect(callArgs.targetTeamIds).toBeDefined();
    expect(Array.isArray(callArgs.targetTeamIds)).toBe(true);
    expect(callArgs.targetTeamIds.length).toBeGreaterThan(0);
    expect(callArgs.targetTeamIds).toEqual(expect.arrayContaining(allTeamIds));
    // 対象限定フィルタなし（全チームのデータを対象）で呼び出されたことを確認
    expect(callArgs).not.toHaveProperty('teamFilter');
    expect(callArgs).toEqual(expect.objectContaining({
      targetTeamIds: allTeamIds,
    }));
  });

  test('assessDeliveryRiskAndProposeAdjustments のスタブが全拠点・全チームに対してリスク評価を実行したことを検証する', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-user-005',
      targetSiteIds: [],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      aggregatePerformanceDataByPeriod: mockAggregatePerformance,
      assessDeliveryRiskAndProposeAdjustments: mockAssessRisk,
    };

    await runTx1Imp1Agent(input, mockAiClient as any);

    expect(mockAssessRisk).toHaveBeenCalled();
    const callArgs = mockAssessRisk.mock.calls[0][0];
    expect(callArgs.targetSiteIds).toBeDefined();
    expect(Array.isArray(callArgs.targetSiteIds)).toBe(true);
    expect(callArgs.targetSiteIds.length).toBeGreaterThan(0);
    expect(callArgs.targetSiteIds).toEqual(expect.arrayContaining(allSiteIds));
    expect(callArgs.targetTeamIds).toBeDefined();
    expect(Array.isArray(callArgs.targetTeamIds)).toBe(true);
    expect(callArgs.targetTeamIds.length).toBeGreaterThan(0);
    expect(callArgs.targetTeamIds).toEqual(expect.arrayContaining(allTeamIds));
    // 対象限定フィルタなし（全拠点・全チームに対してリスク評価）で呼び出されたことを確認
    expect(callArgs).not.toHaveProperty('siteFilter');
    expect(callArgs).not.toHaveProperty('teamFilter');
    expect(callArgs).toEqual(expect.objectContaining({
      targetSiteIds: allSiteIds,
      targetTeamIds: allTeamIds,
    }));
  });

  test('実行結果の affectedSiteIds フィールドに、システム内に存在する全拠点IDが含まれていることを確認する', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin-user-006',
      targetSiteIds: [],
      targetTeamIds: [],
    };

    const mockAiClient = {
      authorizeUserAction: mockAuthorizeUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      aggregatePerformanceDataByPeriod: mockAggregatePerformance,
      assessDeliveryRiskAndProposeAdjustments: mockAssessRisk,
    };

    const result = await runTx1Imp1Agent(input, mockAiClient as any);

    expect(result.affectedSiteIds).toContain('site-001');
    expect(result.affectedSiteIds).toContain('site-002');
    expect(result.affectedSiteIds).toContain('site-003');
    expect(result.affectedSiteIds.length).toBe(3);
  });
});