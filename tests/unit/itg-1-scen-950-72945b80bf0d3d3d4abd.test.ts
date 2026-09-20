import { getProductivityDataById } from '../../src/logic/data-persistence';

describe('getProductivityDataById', () => {
  it('should return productivity data record with all required fields when valid productivityDataId is provided', async () => {
    const validProductivityDataId = 'PROD-12345';

    const result = await getProductivityDataById({
      productivityDataId: validProductivityDataId,
    });

    expect(result).not.toBeNull();
    expect(result).toBeDefined();

    expect(result).toHaveProperty('productivityDataId');
    expect(result).toHaveProperty('workResultId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('facilityId');
    expect(result).toHaveProperty('teamId');
    expect(result).toHaveProperty('workDate');
    expect(result).toHaveProperty('plannedWorkTime');
    expect(result).toHaveProperty('actualWorkTime');
    expect(result).toHaveProperty('completedItemCount');
    expect(result).toHaveProperty('productivityRate');
    expect(result).toHaveProperty('qualityScore');
    expect(result).toHaveProperty('errorCount');
    expect(result).toHaveProperty('proficiencyLevel');

    expect(typeof result.productivityRate).toBe('number');
    expect(typeof result.qualityScore).toBe('number');
    expect(typeof result.errorCount).toBe('number');
    expect(typeof result.proficiencyLevel).toBe('string');

    expect(result.productivityRate).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.errorCount).toBeGreaterThanOrEqual(0);
  });
});