import { listFacilitiesByCondition, ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-518: listFacilitiesByCondition with facility IDs', () => {
  it('should retrieve facilities matching the specified facility IDs', async () => {
    const input: ListFacilitiesByConditionInput = {
      facilityIds: ['FAC-001', 'FAC-002', 'FAC-003'],
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

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result).toBeDefined();
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.facilities.length).toBe(3);

    const facilityIds = result.facilities.map((f) => f.facilityId);
    expect(facilityIds).toContain('FAC-001');
    expect(facilityIds).toContain('FAC-002');
    expect(facilityIds).toContain('FAC-003');

    result.facilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(typeof facility.facilityId).toBe('string');
      expect(facility.facilityCode).toBeDefined();
      expect(typeof facility.facilityCode).toBe('string');
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.facilityName).toBe('string');
      expect(facility.address).toBeDefined();
      expect(typeof facility.address).toBe('string');
      expect(facility.maxCapacity).toBeDefined();
      expect(typeof facility.maxCapacity).toBe('number');
      expect(facility.currentCapacity).toBeDefined();
      expect(typeof facility.currentCapacity).toBe('number');
      expect(facility.operatingStatus).toBeDefined();
      expect(typeof facility.operatingStatus).toBe('string');
      expect(facility.responsiblePersonName).toBeDefined();
      expect(typeof facility.responsiblePersonName).toBe('string');
      expect(facility.contactInfo).toBeDefined();
      expect(typeof facility.contactInfo).toBe('string');
      expect(facility.createdAt).toBeDefined();
      expect(typeof facility.createdAt).toBe('string');
      expect(facility.updatedAt).toBeDefined();
      expect(typeof facility.updatedAt).toBe('string');
      expect(facility.createdBy).toBeDefined();
      expect(typeof facility.createdBy).toBe('string');
    });

    expect(result.totalCount).toBe(3);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate).toEqual(expect.any(Date));
    expect(retrievedDate.toString()).not.toBe('Invalid Date');
  });
});