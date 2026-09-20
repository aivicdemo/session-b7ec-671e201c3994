import { getFacilityById } from '../../src/logic/data-persistence';

describe('SCEN-512: 空文字列の拠点IDで検索するとInvalidFacilityIdFormatErrorが発生する', () => {
  it('should throw InvalidFacilityIdFormatErrorが発生し、エラー文言として「拠点IDは必須です。」が返される', async () => {
    const input = {
      facilityId: '',
    };

    await expect(getFacilityById(input)).rejects.toMatchObject({
      name: 'InvalidFacilityIdFormatError',
      message: '拠点IDは必須です。',
    });
  });
});