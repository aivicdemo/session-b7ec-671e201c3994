import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import { ProgressDataNotAvailableError } from '../../src/errors/ProgressDataNotAvailableError';
import * as dataPersis from '../../src/data-persistence';

jest.mock('../../src/data-persistence');

describe('SCEN-100: WMSからのリアルタイム進捗データが取得できない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ProgressDataNotAvailableErrorを発生させる', async () => {
    // Arrange: data-persistence.tsのgetRecentProgressDataByWorkInstructionスタブを、nullを返すように設定
    (dataPersis.getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue(null);

    // MonitorAndJudgeDelayRiskInput オブジェクトを構築
    const input = {
      facilityIds: ['FAC-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER-123',
    };

    // Act & Assert: progress-monitoring-risk-engine.ts#monitorAndJudgeDelayRisk 関数を呼び出し、例外を検証
    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(ProgressDataNotAvailableError);
    
    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      if (error instanceof ProgressDataNotAvailableError) {
        expect(error.message).toBe('進捗データが利用不可です。WMS連携を確認してください。');
      } else {
        throw error;
      }
    }
  });
});