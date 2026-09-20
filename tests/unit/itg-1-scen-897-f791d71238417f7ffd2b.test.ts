import { getProgressDataById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-897', () => {
  describe('進捗データ取得エラーケース', () => {
    it('進捗データIDがnullの場合、InvalidProgressDataIdエラーが発生する', async () => {
      // Arrange
      const progressDataId = null;

      // Act & Assert
      await expect(async () => {
        await getProgressDataById({ progressDataId: progressDataId as any });
      }).rejects.toThrow();

      try {
        await getProgressDataById({ progressDataId: progressDataId as any });
        fail('エラーが発生するべきでした');
      } catch (error: any) {
        expect(error.name).toBe('InvalidProgressDataIdError');
        expect(error.message).toContain('進捗データIDは必須です。');
      }
    });
  });
});