import { getFacilityById } from '../../src/logic/data-persistence';

describe('SCEN-514: undefinedの拠点IDで検索するとInvalidFacilityIdFormatErrorが発生する', () => {
  it('getFacilityById関数にundefinedのfacilityIdを指定した場合、InvalidFacilityIdFormatErrorが発生する', async () => {
    const input = {
      facilityId: undefined,
    };

    await expect(getFacilityById(input as any)).rejects.toThrow();
    await expect(getFacilityById(input as any)).rejects.toMatchObject({
      name: 'InvalidFacilityIdFormatError',
      message: '拠点IDは必須です。',
    });
  });
});