import { saveFacility } from '../../src/logic/data-persistence';
import { SaveFacilityInput } from '../../src/logic/data-persistence';

describe('SCEN-501: 拠点マスタデータ新規作成・更新時の入力バリデーション', () => {
  describe('最大収容人員数が整数ではない場合', () => {
    it('InvalidFacilityDataErrorが発生する', async () => {
      const input: SaveFacilityInput = {
        facilityId: null,
        facilityName: 'テスト拠点A',
        facilityCode: 'FAC-001',
        address: '東京都渋谷区',
        maxCapacity: 10.5,
        currentCapacity: 5,
        operatingStatus: 'active',
        responsiblePersonName: '山田太郎',
        contactInfo: '090-1234-5678',
        createdBy: 'user001',
      };

      try {
        await saveFacility(input);
        fail('例外がスローされるべきです');
      } catch (error: unknown) {
        expect(error).toEqual(
          expect.objectContaining({
            name: 'InvalidFacilityDataError',
            message: '拠点データが不正です。必須項目を確認してください。',
          })
        );
      }
    });
  });
});