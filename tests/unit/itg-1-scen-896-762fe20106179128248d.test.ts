import { getProgressDataById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-896: 指定されたIDに対応する進捗データが存在しない場合、nullが返される', () => {
    it('存在しない進捗データIDを指定して getProgressDataById を実行し、nullが返されることを確認する', async () => {
      // Arrange
      const nonExistentProgressDataId = 'non-existent-id-12345';
      const input = {
        progressDataId: nonExistentProgressDataId,
      };

      // Act
      const result = await getProgressDataById(input);

      // Assert
      expect(result).toBeNull();
    });
  });
});