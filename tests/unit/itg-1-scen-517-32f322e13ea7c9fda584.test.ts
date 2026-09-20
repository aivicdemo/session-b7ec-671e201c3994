import { listFacilitiesByCondition } from '../../src/logic/data-persistence';
import type { ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-517: 検索条件を指定せずに全拠点を取得する', () => {
  it('should retrieve all facilities when no search conditions are specified', async () => {
    // Arrange
    const input: ListFacilitiesByConditionInput = {
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    // Validate ISO 8601 format
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.toString()).not.toBe('Invalid Date');

    // Validate each facility record
    result.facilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(typeof facility.facilityId).toBe('string');
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.facilityName).toBe('string');
      expect(facility.facilityCode).toBeDefined();
      expect(typeof facility.facilityCode).toBe('string');
      expect(facility.address).toBeDefined();
      expect(facility.maxCapacity).toBeDefined();
      expect(typeof facility.maxCapacity).toBe('number');
      expect(facility.currentCapacity).toBeDefined();
      expect(typeof facility.currentCapacity).toBe('number');
      expect(facility.operatingStatus).toBeDefined();
      expect(typeof facility.operatingStatus).toBe('string');
      expect(facility.responsiblePersonName).toBeDefined();
      expect(facility.contactInfo).toBeDefined();
      expect(facility.createdAt).toBeDefined();
      expect(typeof facility.createdAt).toBe('string');
      expect(facility.updatedAt).toBeDefined();
      expect(typeof facility.updatedAt).toBe('string');
      expect(facility.createdBy).toBeDefined();
      expect(typeof facility.createdBy).toBe('string');
    });

    // Validate totalCount matches facilities array length
    expect(result.facilities.length).toBeLessThanOrEqual(result.totalCount);
  });

  it('should return empty facilities array when no data exists', async () => {
    // Arrange
    const input: ListFacilitiesByConditionInput = {
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
    };

    // Act
    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // Assert
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should retrieve facilities with complete facility information', async () => {
    // Arrange
    const input: ListFacilitiesByConditionInput = {
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
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // Assert
    if (result.facilities.length > 0) {
      const firstFacility = result.facilities[0];

      // Verify all required fields are present
      expect(firstFacility.facilityId).toBeTruthy();
      expect(firstFacility.facilityName).toBeTruthy();
      expect(firstFacility.facilityCode).toBeTruthy();
      expect(firstFacility.address).toBeDefined();
      expect(firstFacility.maxCapacity).toBeGreaterThanOrEqual(0);
      expect(firstFacility.currentCapacity).toBeGreaterThanOrEqual(0);
      expect(firstFacility.currentCapacity).toBeLessThanOrEqual(firstFacility.maxCapacity);
      expect(firstFacility.operatingStatus).toBeTruthy();
      expect(firstFacility.responsiblePersonName).toBeTruthy();
      expect(firstFacility.contactInfo).toBeTruthy();
      expect(firstFacility.createdAt).toBeTruthy();
      expect(firstFacility.updatedAt).toBeTruthy();
      expect(firstFacility.createdBy).toBeTruthy();

      // Verify date formats
      const createdDate = new Date(firstFacility.createdAt);
      const updatedDate = new Date(firstFacility.updatedAt);
      const retrievedDate = new Date(result.retrievedAt);

      expect(createdDate.toString()).not.toBe('Invalid Date');
      expect(updatedDate.toString()).not.toBe('Invalid Date');
      expect(retrievedDate.toString()).not.toBe('Invalid Date');
    }

    // Verify pagination is not applied
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
  });
});