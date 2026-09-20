import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';
import { UnauthorizedAccessError } from '../../src/errors/UnauthorizedAccessError';

jest.mock('../../src/logic/authorization');

describe('SCEN-389: 作業実績データ入力権限がない場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーが作業実績データ入力権限を持たないとき、UnauthorizedAccessErrorが発生する', async () => {
    const { authorizeUserAction } = require('../../src/logic/authorization');

    // 準備: 有効なSubmitWorkPerformanceDataInputを作成
    const input = {
      userId: 'user-001',
      workerId: 'worker-001',
      departmentId: 'dept-001',
      workTypeId: 'worktype-001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '12:00',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: 'テスト作業',
      remarks: '特記事項なし'
    };

    // authorizeUserActionをスタブ化: 権限がない状態を返す
    authorizeUserAction.mockImplementation(async (userId, permission) => {
      throw new UnauthorizedAccessError('この操作を実行する権限がありません。');
    });

    // 実行: submitWorkPerformanceDataを呼び出す
    let caughtError: Error | null = null;
    try {
      await submitWorkPerformanceData(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // 検証
    expect(caughtError).toBeInstanceOf(UnauthorizedAccessError);
    expect(caughtError?.message).toContain('この操作を実行する権限がありません。');
    
    // authorizeUserActionがユーザーIDと権限を引数として呼び出されたことを確認
    expect(authorizeUserAction).toHaveBeenCalledWith(
      input.userId,
      expect.any(String)
    );
    expect(authorizeUserAction).toHaveBeenCalledTimes(1);
  });
});