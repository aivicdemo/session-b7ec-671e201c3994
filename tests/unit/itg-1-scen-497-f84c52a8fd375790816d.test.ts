import { saveFacility } from '../../src/logic/data-persistence';

describe('SCEN-497: 拠点マスタデータの不正データエラー処理', () => {
  describe('拠点名が空文字列の場合', () => {
    it('InvalidFacilityDataErrorが発生し、エラー文言が正しいこと', async () => {
      const input = {
        facilityId: null,
        facilityName: '',
        facilityCode: 'FC001',
        address: '東京都渋谷区',
        maxCapacity: 50,
        currentCapacity: 10,
        operatingStatus: 'active',
        responsiblePersonName: '田中太郎',
        contactInfo: '03-1234-5678',
        createdBy: 'user001',
      };

      await expect(saveFacility(input)).rejects.toMatchObject({
        name: 'InvalidFacilityDataError',
        message: '拠点データが不正です。必須項目を確認してください。',
      });
    });
  });
});