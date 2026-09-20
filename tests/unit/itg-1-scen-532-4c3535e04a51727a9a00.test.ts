import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-532: ソート順序のデフォルト値ascが適用される', () => {
  it('sortOrderがnull（未指定）の場合、デフォルト値ascが適用されること', async () => {
    // Arrange
    const input = {
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: 'facilityId',
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result = await listFacilitiesByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    if (result.facilities.length > 1) {
      for (let i = 0; i < result.facilities.length - 1; i++) {
        const current = result.facilities[i].facilityId;
        const next = result.facilities[i + 1].facilityId;
        expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
      }
    }
  });
});