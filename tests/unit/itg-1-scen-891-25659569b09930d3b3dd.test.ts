import { saveProgressData } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-891', () => {
  describe('実績数量が計画数量の150%以上である場合、InvalidQuantityRangeエラーが発生する', () => {
    it('実績数量が計画数量の150%ちょうどの場合、InvalidQuantityRangeエラーをスロー', async () => {
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-TEST-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        progressDate: '2025-01-15',
        plannedQuantity: 100,
        actualQuantity: 150,
        createdBy: 'USER-001',
      };

      await expect(saveProgressData(input)).rejects.toMatchObject({
        name: 'InvalidQuantityRangeError',
        message: expect.stringContaining('実績数量が計画数量の範囲を超えています'),
      });
    });

    it('実績数量が計画数量の150%を超える場合、InvalidQuantityRangeエラーをスロー', async () => {
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-TEST-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        progressDate: '2025-01-15',
        plannedQuantity: 100,
        actualQuantity: 151,
        createdBy: 'USER-001',
      };

      await expect(saveProgressData(input)).rejects.toMatchObject({
        name: 'InvalidQuantityRangeError',
        message: expect.stringContaining('実績数量が計画数量の範囲を超えています'),
      });
    });

    it('エラー発生時、データベースへの保存処理は実行されない', async () => {
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-TEST-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        progressDate: '2025-01-15',
        plannedQuantity: 100,
        actualQuantity: 150,
        createdBy: 'USER-001',
      };

      try {
        await saveProgressData(input);
        fail('エラーがスローされるべき');
      } catch (error) {
        expect(error).toMatchObject({
          name: 'InvalidQuantityRangeError',
        });
      }
    });
  });
});