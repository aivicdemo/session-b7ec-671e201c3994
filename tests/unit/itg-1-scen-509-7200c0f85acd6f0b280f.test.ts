import { saveFacility } from '../../src/logic/data-persistence';

describe('SCEN-509: 新規作成時にcreatedByが指定されていない場合、不正データエラーが発生する', () => {
  it('should raise InvalidFacilityDataError when createdBy is undefined during facility creation', async () => {
    const input = {
      facilityId: null,
      facilityName: 'テスト拠点',
      facilityCode: 'FC-001',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '田中太郎',
      contactInfo: '090-1234-5678',
      createdBy: undefined,
      updatedBy: undefined,
    };

    await expect(saveFacility(input)).rejects.toThrow();
    await expect(saveFacility(input)).rejects.toThrow('拠点データが不正です。必須項目を確認してください。');
  });
});