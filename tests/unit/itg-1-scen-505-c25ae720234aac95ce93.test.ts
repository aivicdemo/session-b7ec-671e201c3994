import { saveFacility, SaveFacilityInput, SaveFacilityOutput } from '../../src/logic/data-persistence';

describe('SCEN-505: 現在配置人員数が最大収容人員数と等しい場合、正常に保存される', () => {
  it('should save facility data successfully when currentCapacity equals maxCapacity', async () => {
    const input: SaveFacilityInput = {
      facilityId: null,
      facilityName: 'テスト拠点',
      facilityCode: 'FC001',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 100,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '03-xxxx-xxxx',
      createdBy: 'user123'
    };

    const result: SaveFacilityOutput = await saveFacility(input);

    expect(result).toBeDefined();
    expect(result.facilityId).toBeTruthy();
    expect(typeof result.facilityId).toBe('string');
    expect(result.facilityCode).toBe('FC001');
    expect(result.facilityName).toBe('テスト拠点');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.isNewRecord).toBe(true);
  });
});