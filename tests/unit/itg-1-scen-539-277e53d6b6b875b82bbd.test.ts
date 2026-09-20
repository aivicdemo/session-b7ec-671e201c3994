import { listFacilitiesByCondition } from '../../src/logic/data-persistence';
import { ListFacilitiesByConditionInput } from '../../src/logic/data-persistence';

describe('listFacilitiesByCondition - SCEN-539', () => {
  it('should return NoResultsFoundError when no facilities match the search condition', async () => {
    const input: ListFacilitiesByConditionInput = {
      facilityIds: ['FAC-999'],
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

    try {
      await listFacilitiesByCondition(input);
      fail('Expected NoResultsFoundError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('NoResultsFoundError');
      expect(error.message).toBe('指定された条件に合致する拠点が見つかりません。');
    }
  });
});