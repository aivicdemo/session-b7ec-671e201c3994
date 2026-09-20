import { getWmsSyncLogById } from '../../src/logic/data-persistence';

describe('getWmsSyncLogById', () => {
  describe('WMS連携ログが存在しない場合のエラーハンドリング', () => {
    it('データベースに存在しないWMS連携ログIDを指定するとWmsSyncLogNotFoundエラーが発生する', async () => {
      const nonExistentLogId = 'non-existent-log-id-12345';

      const input = {
        wmsSyncLogId: nonExistentLogId
      };

      try {
        await getWmsSyncLogById(input);
        fail('エラーがスローされるべきですが、正常に処理されました');
      } catch (error: any) {
        expect(error.name).toBe('WmsSyncLogNotFound');
        expect(error.message).toContain(`WMS連携ログが見つかりません`);
        expect(error.message).toContain(nonExistentLogId);
      }
    });
  });
});