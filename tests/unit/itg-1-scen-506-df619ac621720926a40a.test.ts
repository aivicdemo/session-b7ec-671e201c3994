import { saveFacility, SaveFacilityInput, SaveFacilityOutput } from '../../src/logic/data-persistence';

describe('SCEN-506: 現在配置人員数が0の場合、正常に保存される', () => {
  it('should successfully save facility with zero current capacity', async () => {
    const input: SaveFacilityInput = {
      facilityId: null,
      facilityName: 'テスト拠点A',
      facilityCode: 'FAC-001',
      address: '東京都渋谷区',
      maxCapacity: 50,
      currentCapacity: 0,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user123',
    };

    const output: SaveFacilityOutput = await saveFacility(input);

    expect(output).toBeDefined();
    expect(output.facilityId).toBeTruthy();
    expect(output.facilityId).not.toBeNull();
    expect(typeof output.facilityId).toBe('string');
    expect(output.facilityCode).toBe('FAC-001');
    expect(output.facilityName).toBe('テスト拠点A');
    expect(output.savedAt).toBeTruthy();
    expect(typeof output.savedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.savedAt)).toBe(true);
    expect(output.isNewRecord).toBe(true);
  });
});