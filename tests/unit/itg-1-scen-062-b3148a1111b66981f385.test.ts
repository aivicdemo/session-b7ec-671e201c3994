import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-062: WMSまたはハンディターミナルからの進捗データ取得失敗時のエラーハンドリング', () => {
  it('進捗データ取得に失敗した場合、executionStatus が failed となりエラーサマリーが設定される', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    // ProgressDataRetrievalError をスロー
    const mockAiClient = {
      monitorAndJudgeDelayRisk: jest.fn().mockImplementation(() => {
        const error = new Error('進捗データの取得に失敗しました。連携ログを確認してください。');
        (error as any).name = 'ProgressDataRetrievalError';
        throw error;
      }),
    };

    const output = await runTx4Imp1Agent(input, mockAiClient as any);

    expect(output.executionStatus).toBe('failed');
    expect(output.errorSummary).not.toBeNull();
    expect(output.errorSummary).toContain('進捗データの取得に失敗しました。連携ログを確認してください。');
    expect(output.delayRiskJudgments).toEqual([]);
    expect(output.identifiedFacilities).toEqual([]);
    expect(output.generatedAllocationPlans).toEqual([]);
    expect(output.approvalResults).toEqual([]);
    expect(output.deliveredInstructions).toEqual([]);
    expect(output.executionId).toBeTruthy();
    expect(typeof output.executionId).toBe('string');
    expect(output.monitoringTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});