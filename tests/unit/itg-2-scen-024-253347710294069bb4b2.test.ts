import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

jest.mock('../../src/agents/tx-3-imp-1/services/monitorProgressAndDetectDelayRisk');

describe('SCEN-024: 進捗データ取得がタイムアウトしキャッシュも無い場合は進捗データ取得失敗エラーで配置案生成中止', () => {
  it('should return failed status with ProgressDataRetrievalFailure error when progress data retrieval times out and no cache is available', async () => {
    const { monitorProgressAndDetectDelayRisk } = require('../../src/agents/tx-3-imp-1/services/monitorProgressAndDetectDelayRisk');

    monitorProgressAndDetectDelayRisk.mockResolvedValue({
      success: false,
      error: {
        code: 'ProgressDataRetrievalFailure',
        message: '進捗データ取得に失敗しました。キャッシュデータも利用不可のため、配置案生成を中止します。',
        cacheAvailable: false,
      },
      delayRiskDetected: false,
      affectedSites: undefined,
    });

    const input: Tx3Imp1AgentInput = {
      triggerType: 'scheduled_monitoring',
      targetSiteIds: ['site-001', 'site-002'],
      delayRiskThreshold: 70,
      approverUserId: 'approver-001',
      approvalTimeoutMinutes: 30,
      executingUserId: 'user-001',
    };

    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {} as any);

    expect(result.executionStatus).toBe('failed');
    expect(result.delayRiskDetected).toBe(false);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.code).toBe('ProgressDataRetrievalFailure');
    expect(result.errorDetails?.message).toBe('進捗データ取得に失敗しました。キャッシュデータも利用不可のため、配置案生成を中止します。');
    expect(result.placementProposalId).toBeUndefined();
    expect(result.placementProposalSummary).toBeUndefined();
    expect(result.affectedSites).toBeUndefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});