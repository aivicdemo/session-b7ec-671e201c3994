import { getProficiencyById } from '../../src/logic/data-persistence';

describe('SCEN-646: getProficiencyById - nonexistent proficiency ID', () => {
  it('should return null when proficiency ID does not exist', async () => {
    const nonexistentId = 'nonexistent-id-999';
    
    const result = await getProficiencyById({
      proficiencyId: nonexistentId,
    });
    
    expect(result).toBeNull();
  });
});