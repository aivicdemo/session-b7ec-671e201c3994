import { getProficiencyById } from '../../src/logic/data-persistence';

describe('SCEN-648: 習熟度IDがnullの場合、InvalidProficiencyIdFormatErrorが発生する', () => {
  it('getProficiencyById を呼び出す際、入力型 GetProficiencyByIdInput の proficiencyId フィールドに null を設定すると、InvalidProficiencyIdFormatError が発生し、エラー文言が "Proficiency ID must be a non-empty string." である', async () => {
    const input = {
      proficiencyId: null as any,
    };

    await expect(getProficiencyById(input)).rejects.toThrow();
    
    try {
      await getProficiencyById(input);
      fail('Expected InvalidProficiencyIdFormatError to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe('Proficiency ID must be a non-empty string.');
    }
  });
});