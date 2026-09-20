import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-533: ページネーション未指定時にページ番号とページサイズがnullで返される', () => {
  it('should return null for pageNumber and pageSize when pagination parameters are not specified', async () => {
    const input = {
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

    const result = await listFacilitiesByCondition(input);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });

  it('should return null for pageNumber and pageSize when pagination parameters are null', async () => {
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

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });

  it('should return facilities array and totalCount without errors', async () => {
    const input = {
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

    let error: Error | null = null;
    let result;

    try {
      result = await listFacilitiesByCondition(input);
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeNull();
    expect(result).toBeDefined();
    expect(result?.facilities).toBeDefined();
    expect(result?.totalCount).toBeDefined();
    expect(result?.retrievedAt).toBeDefined();
  });
});