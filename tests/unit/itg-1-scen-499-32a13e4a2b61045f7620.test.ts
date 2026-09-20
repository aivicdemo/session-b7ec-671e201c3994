import { saveFacility, InvalidFacilityDataError } from '../../src/logic/data-persistence';

describe('SCEN-499: 拠点マスタデータの新規作成時に住所が空文字列の場合エラーが発生する', () => {
  it('住所が空文字列の場合、InvalidFacilityDataErrorが発生する', async () => {
    const input = {
      facilityId: null,
      facilityName: 'テスト拠点',
      facilityCode: 'FAC-001',
      address: '',
      maxCapacity: 50,
      currentCapacity: 10,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user001',
    };

    let thrownError: Error | null = null;
    let result: any = undefined;

    try {
      result = await saveFacility(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // InvalidFacilityDataError が発生すること
    expect(thrownError).toBeInstanceOf(InvalidFacilityDataError);
    
    // エラー文言の検証
    expect(thrownError).toHaveProperty('message', '拠点データが不正です。必須項目を確認してください。');
    
    // SaveFacilityOutput が返されていないことを検証
    expect(result).toBeUndefined();
  });
});