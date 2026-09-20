import { saveFacility, SaveFacilityInput } from '../../src/logic/data-persistence';

describe('SCEN-498: 拠点コードが空文字列の場合、不正データエラーが発生する', () => {
  it('facilityCodeが空文字列の場合、InvalidFacilityDataErrorが発生すること', async () => {
    const input: SaveFacilityInput = {
      facilityId: null,
      facilityName: '拠点A',
      facilityCode: '',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '田中太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user001',
    };

    await expect(saveFacility(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidFacilityDataError',
        message: expect.stringContaining('拠点データが不正です。必須項目を確認してください。'),
      })
    );
  });
});