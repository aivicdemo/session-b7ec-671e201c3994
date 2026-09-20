import { getWorkInstructionById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-684', () => {
  describe('getWorkInstructionById', () => {
    it('データベースに存在しない作業指示IDを指定するとWorkInstructionNotFoundエラーが発生する', async () => {
      const nonExistentWorkInstructionId = 'non-existent-id-12345';

      const input = {
        workInstructionId: nonExistentWorkInstructionId,
      };

      await expect(getWorkInstructionById(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'WorkInstructionNotFound',
          message: '指定された作業指示IDの作業指示が見つかりません。',
        })
      );
    });
  });
});