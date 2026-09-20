import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-523: 最大収容人員数の範囲で検索して該当レコードを取得する', () => {
  it('should retrieve facilities within the specified capacity range', async () => {
    const input = {
      minCapacity: 50,
      maxCapacity: 150,
      facilityNameKeyword: null,
      facilityIds: null,
      facilityCodes: null,
      operatingStatuses: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const output = await listFacilitiesByCondition(input);

    expect(output).toBeDefined();
    expect(output.facilities).toBeInstanceOf(Array);
    expect(output.totalCount).toBeGreaterThanOrEqual(output.facilities.length);

    output.facilities.forEach((facility) => {
      expect(facility.maxCapacity).toBeGreaterThanOrEqual(50);
      expect(facility.maxCapacity).toBeLessThanOrEqual(150);
    });

    expect(output.pageNumber).toBeNull();
    expect(output.pageSize).toBeNull();

    const retrievedAtRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(output.retrievedAt).toMatch(retrievedAtRegex);
  });
});