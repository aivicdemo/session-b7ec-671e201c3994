import { getWorkerById, GetWorkerByIdInput } from '../../src/logic/data-persistence';
import { DatabaseAccessError } from '../../src/errors/DatabaseAccessError';

describe('SCEN-597: データベース接続障害が発生したとき、DatabaseAccessErrorを発生させる', () => {
  it('should throw DatabaseAccessError with correct message when database connection fails', async () => {
    // データベース接続層をスタブ化し、接続障害を発生させるよう設定
    const databaseConnectionModule = require('../../src/infrastructure/database');
    jest.spyOn(databaseConnectionModule, 'executeQuery').mockRejectedValue(
      new Error('Database connection failed')
    );

    const input: GetWorkerByIdInput = {
      workerId: 'WORKER-001',
    };

    // getWorkerById 関数を実行する
    try {
      await getWorkerById(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error) {
      // 発生した例外を捕捉し、例外型を確認する
      expect(error).toBeInstanceOf(DatabaseAccessError);
      expect((error as DatabaseAccessError).message).toBe(
        '作業者マスタの検索に失敗しました。'
      );
    }
  });
});