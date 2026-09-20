import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-531: ページサイズのデフォルト値50が適用される', () => {
  it('pageSize明示指定なし時にデフォルト値50が適用されること', async () => {
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listFacilitiesByCondition(input);

    expect(result.pageSize).toBe(50);
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.facilities.length).toBeLessThanOrEqual(50);
    expect(result.pageNumber).toBeNull();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
    result.facilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(facility.facilityCode).toBeDefined();
      expect(facility.address).toBeDefined();
      expect(facility.maxCapacity).toBeDefined();
      expect(facility.currentCapacity).toBeDefined();
      expect(facility.operatingStatus).toBeDefined();
      expect(facility.responsiblePersonName).toBeDefined();
      expect(facility.contactInfo).toBeDefined();
      expect(facility.createdAt).toBeDefined();
      expect(facility.updatedAt).toBeDefined();
      expect(facility.createdBy).toBeDefined();
    });
  });
});