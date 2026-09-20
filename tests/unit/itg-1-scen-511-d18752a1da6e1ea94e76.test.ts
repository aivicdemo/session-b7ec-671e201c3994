import { getFacilityById } from '../../src/logic/data-persistence';

describe('SCEN-511: getFacilityById - FacilityNotFoundError when facility does not exist', () => {
  it('should throw FacilityNotFoundError when searching with a non-existent facility ID', async () => {
    const nonExistentFacilityId = 'FACILITY-99999';

    try {
      await getFacilityById({
        facilityId: nonExistentFacilityId,
      });
      fail('Expected FacilityNotFoundError to be thrown');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.name).toBe('FacilityNotFoundError');
      expect(error.message).toContain('指定された拠点IDの拠点マスタが見つかりません。');
    }
  });
});