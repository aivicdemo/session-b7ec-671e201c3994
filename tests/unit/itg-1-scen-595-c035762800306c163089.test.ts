import { getWorkerById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-595', () => {
  describe('getWorkerById', () => {
    it('作業者IDが空文字列のとき、InvalidWorkerIdFormatErrorを発生させる', async () => {
      // Arrange
      const input = {
        workerId: ''
      };

      // Act & Assert
      await expect(getWorkerById(input)).rejects.toThrow('InvalidWorkerIdFormatError');
      await expect(getWorkerById(input)).rejects.toThrow('作業者IDは空でない文字列である必要があります。');
    });
  });
});