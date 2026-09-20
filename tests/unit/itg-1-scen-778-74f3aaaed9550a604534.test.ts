import { getAllocationPlanById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - 人員配置案取得', () => {
  describe('SCEN-778: 人員配置案IDが空文字列の場合', () => {
    it('InvalidAllocationPlanIdエラーが発生する', async () => {
      // Arrange
      const input = {
        allocationPlanId: '',
      };

      // Act & Assert
      await expect(getAllocationPlanById(input)).rejects.toMatchObject({
        name: 'InvalidAllocationPlanId',
        message: '人員配置案IDは必須です。',
      });
    });
  });
});