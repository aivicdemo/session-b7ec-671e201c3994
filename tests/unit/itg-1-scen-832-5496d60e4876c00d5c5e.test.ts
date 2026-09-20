import { getAllocationExecutionStatusById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - 人員配置実行状況取得エラーハンドリング', () => {
  describe('getAllocationExecutionStatusById', () => {
    it('人員配置実行状況IDがデータベースに存在しない場合、AllocationExecutionStatusNotFoundエラーを返す', async () => {
      const nonExistentId = 'non-existent-id-12345';

      await expect(
        getAllocationExecutionStatusById({
          allocationExecutionStatusId: nonExistentId,
        })
      ).rejects.toThrow('人員配置実行状況が見つかりません。ID: non-existent-id-12345');
    });
  });
});