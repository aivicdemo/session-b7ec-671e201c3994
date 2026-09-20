import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/repositories/worker-repository', () => ({
  getWorkerById: jest.fn()
}));

jest.mock('../../src/services/audit-service', () => ({
  recordOperationAudit: jest.fn()
}));

import { getWorkerById } from '../../src/repositories/worker-repository';
import { recordOperationAudit } from '../../src/services/audit-service';

describe('SCEN-335: 作業実績集約と生産性指標計算 - 作業者未検出エラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('作業者IDがマスタに存在しない場合、WorkerNotFoundError 例外がスロー（throw）される', async () => {
    // スタブ設定: getWorkerById は null を返す（作業者マスタに該当IDが存在しない状態を模擬）
    (getWorkerById as jest.Mock).mockResolvedValue(null);

    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'WI001',
          workerId: 'W999999',
          facilityId: 'F001',
          teamId: 'T001',
          workStartDateTime: '2025-01-15T08:00:00Z',
          workEndDateTime: '2025-01-15T09:00:00Z',
          completedQuantity: 10,
          defectQuantity: 1,
          errorCount: 0,
          remarks: 'テスト'
        }
      ],
      wmsWorkResults: [],
      aggregationDate: '2025-01-15',
      executingUserId: 'U001'
    };

    let thrownError: Error | null = null;

    try {
      await aggregateWorkResultsAndCalculateProductivity(input);
      fail('例外がスロー（throw）されるべき');
    } catch (error) {
      thrownError = error as Error;
      
      // 例外の型・名前・メッセージを検証
      expect(error).toBeInstanceOf(Error);
      expect((error as any).name).toBe('WorkerNotFoundError');
      expect((error as any).message).toBe('作業者ID W999999 が見つかりません。');
      
      // スタックトレースに公開処理名が含まれることを検証
      expect((error as any).stack).toContain('aggregateWorkResultsAndCalculateProductivity');
    }

    // 例外がスロー（throw）されたことを確認
    expect(thrownError).not.toBeNull();
    expect(thrownError?.name).toBe('WorkerNotFoundError');

    // recordOperationAudit への呼び出しが行われていないことを検証
    expect(recordOperationAudit).not.toHaveBeenCalled();
  });
});