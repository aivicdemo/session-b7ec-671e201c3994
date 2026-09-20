import { saveFacility } from '../../src/logic/data-persistence';

describe('SCEN-500: 拠点マスタデータ新規作成・更新時のバリデーション', () => {
  describe('最大収容人員数が0以下の場合、不正データエラーが発生する', () => {
    it('maxCapacityが0の場合、InvalidFacilityDataErrorが発生する', async () => {
      const input = {
        facilityId: null,
        facilityName: 'テスト拠点A',
        facilityCode: 'FAC-001',
        address: '東京都渋谷区',
        maxCapacity: 0,
        currentCapacity: 0,
        operatingStatus: 'active',
        responsiblePersonName: '山田太郎',
        contactInfo: '090-1234-5678',
        createdBy: 'user-001',
      };

      await expect(saveFacility(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidFacilityDataError',
          message: '拠点データが不正です。必須項目を確認してください。',
        })
      );
    });

    it('maxCapacityが負の値の場合、InvalidFacilityDataErrorが発生する', async () => {
      const input = {
        facilityId: null,
        facilityName: 'テスト拠点A',
        facilityCode: 'FAC-001',
        address: '東京都渋谷区',
        maxCapacity: -5,
        currentCapacity: 0,
        operatingStatus: 'active',
        responsiblePersonName: '山田太郎',
        contactInfo: '090-1234-5678',
        createdBy: 'user-001',
      };

      await expect(saveFacility(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidFacilityDataError',
          message: '拠点データが不正です。必須項目を確認してください。',
        })
      );
    });
  });
});