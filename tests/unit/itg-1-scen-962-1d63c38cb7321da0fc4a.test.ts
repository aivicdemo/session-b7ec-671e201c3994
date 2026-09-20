import { listProductivityDataByCondition, ListProductivityDataByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-962: ソート対象フィールドが生産性データテーブルに存在しない場合、ソート条件エラーが発生する', () => {
  it('should raise InvalidSortConditionError when sortBy specifies a non-existent field', async () => {
    const input: ListProductivityDataByConditionInput = {
      sortBy: 'nonExistentField',
      sortOrder: 'ASC',
      productivityDataIds: undefined,
      workResultIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortConditionError',
        message: expect.stringContaining('ソート条件が不正です'),
      })
    );
  });
});