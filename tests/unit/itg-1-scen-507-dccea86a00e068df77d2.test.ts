import { saveFacility } from '../../src/logic/data-persistence';

describe('SCEN-507: 稼働状況の値検証エラー', () => {
  it('稼働状況がactive・inactive・maintenance以外の値の場合、InvalidFacilityDataErrorが発生する', async () => {
    const invalidInput = {
      facilityId: null,
      facilityName: 'テスト拠点',
      facilityCode: 'TEST001',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'running',
      responsiblePersonName: '山田太郎',
      contactInfo: '090-xxxx-xxxx',
      createdBy: 'user123',
    };

    await expect(saveFacility(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        message: '拠点データが不正です。必須項目を確認してください。',
      })
    );
  });
});