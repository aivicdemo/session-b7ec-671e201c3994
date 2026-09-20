import { getFacilityById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-513', () => {
  describe('getFacilityById', () => {
    it('nullの拠点IDで検索するとInvalidFacilityIdFormatErrorが発生する', async () => {
      const input = {
        facilityId: null as any,
      };

      await expect(getFacilityById(input)).rejects.toThrow();
      await expect(getFacilityById(input)).rejects.toMatchObject({
        name: 'InvalidFacilityIdFormatError',
        message: '拠点IDは必須です。',
      });
    });
  });
});