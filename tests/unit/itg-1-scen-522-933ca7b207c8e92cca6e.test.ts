import { listFacilitiesByCondition, ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput, GetFacilityByIdOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual('../../src/logic/data-persistence'),
  validateDateTimeRange: jest.fn(() => ({ valid: true })),
}));

describe('SCEN-522: 稼働状況で検索して該当レコードを取得する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return facilities matching the specified operating status', async () => {
    const input: ListFacilitiesByConditionInput = {
      operatingStatuses: ['稼働中'],
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result).toBeDefined();
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);

    result.facilities.forEach((facility: GetFacilityByIdOutput) => {
      expect(facility.operatingStatus).toBe('稼働中');
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(facility.facilityCode).toBeDefined();
      expect(facility.address).toBeDefined();
      expect(facility.maxCapacity).toBeDefined();
      expect(facility.currentCapacity).toBeDefined();
      expect(facility.responsiblePersonName).toBeDefined();
      expect(facility.contactInfo).toBeDefined();
      expect(facility.createdAt).toBeDefined();
      expect(facility.updatedAt).toBeDefined();
      expect(facility.createdBy).toBeDefined();
    });

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBeGreaterThanOrEqual(result.facilities.length);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    expect(result.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });

  it('should not include facilities with other operating statuses', async () => {
    const input: ListFacilitiesByConditionInput = {
      operatingStatuses: ['稼働中'],
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    result.facilities.forEach((facility: GetFacilityByIdOutput) => {
      expect(['休止中', '廃止', 'maintenance']).not.toContain(facility.operatingStatus);
    });
  });

  it('should return pagination fields as null when pagination is not specified', async () => {
    const input: ListFacilitiesByConditionInput = {
      operatingStatuses: ['稼働中'],
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });
});