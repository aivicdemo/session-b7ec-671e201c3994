import { getProficiencyById } from '../../src/logic/data-persistence';

describe('SCEN-647: 習熟度IDが空文字列の場合、InvalidProficiencyIdFormatErrorが発生する', () => {
  it('should throw InvalidProficiencyIdFormatError when proficiencyId is an empty string', async () => {
    const input = {
      proficiencyId: '',
    };

    await expect(getProficiencyById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProficiencyIdFormatError',
        message: 'Proficiency ID must be a non-empty string.',
      })
    );
  });
});