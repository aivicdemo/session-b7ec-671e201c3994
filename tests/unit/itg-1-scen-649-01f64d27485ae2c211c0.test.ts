import { getProficiencyById } from '../../src/logic/data-persistence';

describe('getProficiencyById', () => {
  describe('SCEN-649: 習熟度IDがundefinedの場合のエラーハンドリング', () => {
    it('should throw InvalidProficiencyIdFormatError when proficiencyId is undefined', async () => {
      const input = {
        proficiencyId: undefined as any,
      };

      await expect(getProficiencyById(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidProficiencyIdFormatError',
          message: expect.stringContaining('Proficiency ID must be a non-empty string'),
        })
      );
    });
  });
});