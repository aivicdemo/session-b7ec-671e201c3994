import { saveProductivityData } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-938', () => {
  describe('指定された facilityId が既存データに存在しない場合、ReferentialIntegrityViolation エラーが発生する', () => {
    it('facilityId が未存在の場合、ReferentialIntegrityViolation エラーをスロー', async () => {
      const input = {
        productivityDataId: null,
        workResultId: 'WR-001',
        workerId: 'W-001',
        facilityId: 'FAC-999',
        teamId: 'T-001',
        workDate: '2024-01-15T08:00:00Z',
        plannedWorkTime: 480,
        actualWorkTime: 450,
        completedItemCount: 100,
        productivityRate: 0.9375,
        qualityScore: 0.95,
        errorCount: 2,
        proficiencyLevel: '中級',
        remarks: null,
        createdBy: 'USR-ADMIN',
        updatedBy: null,
      };

      await expect(saveProductivityData(input)).rejects.toMatchObject({
        name: 'ReferentialIntegrityViolation',
        message: '参照先の作業実績、作業者、拠点、チームが見つかりません。',
      });
    });
  });
});