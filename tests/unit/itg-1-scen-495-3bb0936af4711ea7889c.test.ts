import {
  saveFacility,
  SaveFacilityInput,
  SaveFacilityOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-495: saveFacility - 新規拠点作成', () => {
  it('should create a new facility with all required fields and return isNewRecord=true', async () => {
    const input: SaveFacilityInput = {
      facilityId: null,
      facilityName: '新規拠点A',
      facilityCode: 'FAC-001-NEW',
      address: '東京都渋谷区1-2-3',
      maxCapacity: 50,
      currentCapacity: 10,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user-123',
      updatedBy: undefined,
    };

    const result: SaveFacilityOutput = await saveFacility(input);

    expect(result).toBeDefined();
    expect(result.facilityId).toBeDefined();
    expect(typeof result.facilityId).toBe('string');
    expect(result.facilityId).not.toBe('');
    expect(result.facilityCode).toBe('FAC-001-NEW');
    expect(result.facilityName).toBe('新規拠点A');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedAt)).toBe(true);
    expect(result.isNewRecord).toBe(true);
  });
});