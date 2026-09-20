import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-528: listFacilitiesByCondition - ソート機能', () => {
  it('should return facilities sorted by maxCapacity in descending order', async () => {
    const input = {
      sortBy: 'maxCapacity',
      sortOrder: 'desc',
    };

    const result = await listFacilitiesByCondition(input);

    expect(result).toBeDefined();
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);

    // Verify descending order of maxCapacity
    for (let i = 0; i < result.facilities.length - 1; i++) {
      expect(result.facilities[i].maxCapacity).toBeGreaterThanOrEqual(
        result.facilities[i + 1].maxCapacity,
      );
    }

    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(Number.isInteger(result.totalCount)).toBe(true);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
  });
});