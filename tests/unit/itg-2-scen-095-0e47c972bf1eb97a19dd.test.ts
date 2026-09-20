import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-095: 受注急増が検知されていない場合のエラー処理', () => {
  it('orderVolumeIncreaseContextのdetectionTimestampがnullの場合、OrderVolumeIncreaseNotDetectedエラーを返す', async () => {
    const input = {
      orderVolumeIncreaseContext: {
        detectionTimestamp: null as any,
        orderVolumePercentageIncrease: 0,
        affectedTeamIds: [],
        affectedSiteIds: [],
        orderDeadlineDate: '2024-02-15',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'user-123',
      dataRetrievalTimeoutMs: 30000,
      useCachedDataIfRetrievalFails: true,
    };

    const result = await runTx6Imp1Agent(input, {} as any);

    expect(result.executionStatus).toBe('failed');
    expect(result.placementProposalId).toBeNull();
    expect(result.proposedPlacementChanges).toEqual([]);
    expect(result.deliveryInstructionStatus).toBe('failed');
    expect(result.notificationsSent).toEqual([]);
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails![0].errorCode).toBe('OrderVolumeIncreaseNotDetected');
    expect(result.errorDetails![0].errorMessage).toContain('受注急増が検知されていません');
    expect(result.errorDetails![0].affectedComponent).toBe('orderVolumeIncreaseContext');
    expect(result.errorDetails![0].recoveryAction).toContain('受注データを確認し');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('orderVolumePercentageIncreaseが0の場合、OrderVolumeIncreaseNotDetectedエラーを返す', async () => {
    const input = {
      orderVolumeIncreaseContext: {
        detectionTimestamp: '2024-01-15T10:00:00Z',
        orderVolumePercentageIncrease: 0,
        affectedTeamIds: [],
        affectedSiteIds: [],
        orderDeadlineDate: '2024-02-15',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'user-123',
      dataRetrievalTimeoutMs: 30000,
      useCachedDataIfRetrievalFails: true,
    };

    const result = await runTx6Imp1Agent(input, {} as any);

    expect(result.executionStatus).toBe('failed');
    expect(result.placementProposalId).toBeNull();
    expect(result.proposedPlacementChanges).toEqual([]);
    expect(result.deliveryInstructionStatus).toBe('failed');
    expect(result.notificationsSent).toEqual([]);
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails![0].errorCode).toBe('OrderVolumeIncreaseNotDetected');
  });

  it('detectionTimestampが未定義の場合、OrderVolumeIncreaseNotDetectedエラーを返す', async () => {
    const input = {
      orderVolumeIncreaseContext: {
        detectionTimestamp: undefined as any,
        orderVolumePercentageIncrease: 0,
        affectedTeamIds: [],
        affectedSiteIds: [],
        orderDeadlineDate: '2024-02-15',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'user-123',
      dataRetrievalTimeoutMs: 30000,
      useCachedDataIfRetrievalFails: true,
    };

    const result = await runTx6Imp1Agent(input, {} as any);

    expect(result.executionStatus).toBe('failed');
    expect(result.placementProposalId).toBeNull();
    expect(result.proposedPlacementChanges).toEqual([]);
    expect(result.deliveryInstructionStatus).toBe('failed');
    expect(result.notificationsSent).toEqual([]);
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails![0].errorCode).toBe('OrderVolumeIncreaseNotDetected');
    expect(result.executionTimestamp).toBeTruthy();
  });
});