import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-036: DelayRiskCalculationFailure時の処理中止', () => {
  it('不完全なデータセット（進捗率が矛盾）でDelayRiskCalculationFailureが発生し、後続処理が実行されない', async () => {
    const input = {
      triggerType: 'realtime_monitoring' as const,
      delayRiskThreshold: 70,
      targetSiteIds: ['site-001', 'site-002'],
      executingUserId: 'user-123',
    };

    const aiClient = {
      orchestrateDataCollectionForDelayRisk: jest.fn(async () => ({
        progressRate: 90,
        deliveryDeadline: new Date('2024-12-25T18:00:00Z').toISOString(),
        remainingTimeSeconds: 3600,
      })),
      monitorProgressAndDetectDelayRisk: jest.fn(async () => ({
        progressRate: 110,
        deliveryDeadline: new Date('2024-12-25T18:00:00Z').toISOString(),
        remainingTimeSeconds: 3600,
      })),
      judgePersonnelReallocationFeasibility: jest.fn(async () => ({})),
      assessDeliveryRiskAndProposeAdjustments: jest.fn(async () => ({})),
      deliverPlacementInstructionToFieldLeader: jest.fn(async () => ({})),
    };

    const result = await runTx4Imp1Agent(input, aiClient as any);

    expect(result.executionStatus).toBe('failure');
    expect(result.detectedDelayRisks).toEqual([]);
    expect(result.affectedSites).toEqual([]);
    expect(result.placementProposals).toEqual([]);
    expect(result.deliveryInstructions).toEqual([]);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    const delayRiskError = result.errorDetails![0];
    expect(delayRiskError.errorName).toBe('DelayRiskCalculationFailure');
    expect(delayRiskError.errorMessage).toBe(
      '遅延リスク計算に必要なデータが不完全です。対応拠点の特定を中止します。',
    );
    expect(aiClient.judgePersonnelReallocationFeasibility).not.toHaveBeenCalled();
    expect(aiClient.assessDeliveryRiskAndProposeAdjustments).not.toHaveBeenCalled();
    expect(aiClient.deliverPlacementInstructionToFieldLeader).not.toHaveBeenCalled();
  });

  it('残り時間が負数の不完全なデータでDelayRiskCalculationFailureが発生', async () => {
    const input = {
      triggerType: 'realtime_monitoring' as const,
      delayRiskThreshold: 70,
      targetSiteIds: ['site-001'],
      executingUserId: 'user-123',
    };

    const aiClient = {
      orchestrateDataCollectionForDelayRisk: jest.fn(async () => ({
        progressRate: 90,
        deliveryDeadline: new Date('2024-12-25T18:00:00Z').toISOString(),
        remainingTimeSeconds: 3600,
      })),
      monitorProgressAndDetectDelayRisk: jest.fn(async () => ({
        progressRate: 85,
        deliveryDeadline: new Date('2024-12-25T18:00:00Z').toISOString(),
        remainingTimeSeconds: -300,
      })),
      judgePersonnelReallocationFeasibility: jest.fn(async () => ({})),
      assessDeliveryRiskAndProposeAdjustments: jest.fn(async () => ({})),
      deliverPlacementInstructionToFieldLeader: jest.fn(async () => ({})),
    };

    const result = await runTx4Imp1Agent(input, aiClient as any);

    expect(result.executionStatus).toBe('failure');
    expect(result.detectedDelayRisks).toEqual([]);
    expect(result.affectedSites).toEqual([]);
    expect(result.placementProposals).toEqual([]);
    expect(result.deliveryInstructions).toEqual([]);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    const delayRiskError = result.errorDetails![0];
    expect(delayRiskError.errorName).toBe('DelayRiskCalculationFailure');
    expect(delayRiskError.errorMessage).toBe(
      '遅延リスク計算に必要なデータが不完全です。対応拠点の特定を中止します。',
    );
    expect(aiClient.judgePersonnelReallocationFeasibility).not.toHaveBeenCalled();
    expect(aiClient.assessDeliveryRiskAndProposeAdjustments).not.toHaveBeenCalled();
    expect(aiClient.deliverPlacementInstructionToFieldLeader).not.toHaveBeenCalled();
  });

  it('進捗率がnullの不完全なデータでDelayRiskCalculationFailureが発生', async () => {
    const input = {
      triggerType: 'realtime_monitoring' as const,
      delayRiskThreshold: 70,
      targetSiteIds: ['site-002'],
      executingUserId: 'user-123',
    };

    const aiClient = {
      orchestrateDataCollectionForDelayRisk: jest.fn(async () => ({
        progressRate: 90,
        deliveryDeadline: new Date('2024-12-25T18:00:00Z').toISOString(),
        remainingTimeSeconds: 3600,
      })),
      monitorProgressAndDetectDelayRisk: jest.fn(async () => ({
        progressRate: null,
        deliveryDeadline: new Date('2024-12-25T18:00:00Z').toISOString(),
        remainingTimeSeconds: 3600,
      })),
      judgePersonnelReallocationFeasibility: jest.fn(async () => ({})),
      assessDeliveryRiskAndProposeAdjustments: jest.fn(async () => ({})),
      deliverPlacementInstructionToFieldLeader: jest.fn(async () => ({})),
    };

    const result = await runTx4Imp1Agent(input, aiClient as any);

    expect(result.executionStatus).toBe('failure');
    expect(result.detectedDelayRisks).toEqual([]);
    expect(result.affectedSites).toEqual([]);
    expect(result.placementProposals).toEqual([]);
    expect(result.deliveryInstructions).toEqual([]);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    const delayRiskError = result.errorDetails![0];
    expect(delayRiskError.errorName).toBe('DelayRiskCalculationFailure');
    expect(delayRiskError.errorMessage).toBe(
      '遅延リスク計算に必要なデータが不完全です。対応拠点の特定を中止します。',
    );
    expect(aiClient.judgePersonnelReallocationFeasibility).not.toHaveBeenCalled();
    expect(aiClient.assessDeliveryRiskAndProposeAdjustments).not.toHaveBeenCalled();
    expect(aiClient.deliverPlacementInstructionToFieldLeader).not.toHaveBeenCalled();
  });

  it('納期がnullの不完全なデータでDelayRiskCalculationFailureが発生', async () => {
    const input = {
      triggerType: 'realtime_monitoring' as const,
      delayRiskThreshold: 70,
      targetSiteIds: ['site-003'],
      executingUserId: 'user-123',
    };

    const aiClient = {
      orchestrateDataCollectionForDelayRisk: jest.fn(async () => ({
        progressRate: 90,
        deliveryDeadline: new Date('2024-12-25T18:00:00Z').toISOString(),
        remainingTimeSeconds: 3600,
      })),
      monitorProgressAndDetectDelayRisk: jest.fn(async () => ({
        progressRate: 85,
        deliveryDeadline: null,
        remainingTimeSeconds: 3600,
      })),
      judgePersonnelReallocationFeasibility: jest.fn(async () => ({})),
      assessDeliveryRiskAndProposeAdjustments: jest.fn(async () => ({})),
      deliverPlacementInstructionToFieldLeader: jest.fn(async () => ({})),
    };

    const result = await runTx4Imp1Agent(input, aiClient as any);

    expect(result.executionStatus).toBe('failure');
    expect(result.detectedDelayRisks).toEqual([]);
    expect(result.affectedSites).toEqual([]);
    expect(result.placementProposals).toEqual([]);
    expect(result.deliveryInstructions).toEqual([]);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    const delayRiskError = result.errorDetails![0];
    expect(delayRiskError.errorName).toBe('DelayRiskCalculationFailure');
    expect(delayRiskError.errorMessage).toBe(
      '遅延リスク計算に必要なデータが不完全です。対応拠点の特定を中止します。',
    );
    expect(aiClient.judgePersonnelReallocationFeasibility).not.toHaveBeenCalled();
    expect(aiClient.assessDeliveryRiskAndProposeAdjustments).not.toHaveBeenCalled();
    expect(aiClient.deliverPlacementInstructionToFieldLeader).not.toHaveBeenCalled();
  });
});