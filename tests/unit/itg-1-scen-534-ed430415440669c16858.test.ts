import { listFacilitiesByCondition, ListFacilitiesByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-534: listFacilitiesByCondition - 検索結果が0件の場合', () => {
  it('すべての検索条件が未指定で、データベースに拠点レコードが存在しない場合、空配列と総件数0を返す', async () => {
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listFacilitiesByCondition(input);

    expect(result.facilities).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toBeDefined();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});