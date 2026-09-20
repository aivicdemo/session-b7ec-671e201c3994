import { monitorAndJudgeDelayRisk, MonitorAndJudgeDelayRiskInput } from '../../src/logic/progress-monitoring-risk-engine';

// Mock the WMS Handy Terminal Data Source
jest.mock('../../src/adapters/wms-handy-terminal-data-source', () => ({
  WmsHandyTerminalDataSource: {
    fetchProgressData: jest.fn(),
  },
}));

describe('SCEN-1565: 進捗遅延リスク常時監視 - 計画完了時刻が過去の場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('計画完了時刻がevaluationDateTimeより前の場合、エラーメッセージ「計画完了時刻が過去です。データを確認してください」がスローされる', async () => {
    // Arrange: MonitorAndJudgeDelayRiskInputを仕様通りに生成
    const evaluationDateTime = '2024-01-15T10:00:00Z';
    const evaluationDateTimeSeconds = Math.floor(new Date(evaluationDateTime).getTime() / 1000);

    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: evaluationDateTime,
      userId: 'USER001',
    };

    // 入力型フィールドが仕様通りに設定されていることを検証
    expect(input.facilityIds).toEqual(['F001']);
    expect(input.teamIds).toBeUndefined();
    expect(input.workInstructionIds).toBeUndefined();
    expect(input.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
    expect(input.userId).toBe('USER001');

    // Mock WMS data source to return progress data
    // br-tx_4-005の制約に基づき、plannedCompletionTimeがevaluationDateTimeより前となるデータを準備
    // 仕様: plannedCompletionTime=1705315200（2024-01-15T09:00:00Z、evaluationDateTimeの1時間前）
    const { WmsHandyTerminalDataSource } = require('../../src/adapters/wms-handy-terminal-data-source');
    
    // 仕様で指定された具体値：1705315200秒 = 2024-01-15T09:00:00Z
    // evaluationDateTimeSeconds = 1705318800（2024-01-15T10:00:00Z）
    // plannedCompletionTimeがevaluationDateTimeより1時間前
    const plannedCompletionTime = 1705315200;
    
    // br-tx_4-005の制約『計画完了時刻が現在時刻より前のとき』を検証するため、
    // plannedCompletionTime < evaluationDateTimeSeconds の条件を確認
    expect(plannedCompletionTime).toBeLessThan(evaluationDateTimeSeconds);
    
    const facilityProgressData = {
      facilityId: 'F001',
      teamId: 'T001',
      workInstructionId: 'WI001',
      plannedCompletionTime: plannedCompletionTime,
      currentProgressRate: 50,
      actualProgressRate: 45,
      plannedEndDateTime: new Date(plannedCompletionTime * 1000).toISOString(),
    };

    WmsHandyTerminalDataSource.fetchProgressData.mockResolvedValue([facilityProgressData]);

    // Act & Assert
    // monitorAndJudgeDelayRisk関数を入力型フィールド値で呼び出し
    let caughtError: Error | null = null;
    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify that WMS Handy Terminal Data Source was called
    expect(WmsHandyTerminalDataSource.fetchProgressData).toHaveBeenCalled();

    // br-tx_4-005の制約: 計画完了時刻が現在時刻より前のとき、例外をスロー
    // 例外がスローされたことを明示的に検証
    expect(caughtError).not.toBeNull();
    // 例外メッセージが指定の文言を含むことを検証
    expect(caughtError?.message).toContain('計画完了時刻が過去です。データを確認してください');
    
    // br-tx_4-005の制約『[throw] 計画完了時刻が現在時刻より前のとき → 「計画完了時刻が過去です。データを確認してください」』
    // に基づいて、この条件判定が実装内で正確に行われたことを確認
    expect(caughtError?.message).toBe('計画完了時刻が過去です。データを確認してください');
  });
});