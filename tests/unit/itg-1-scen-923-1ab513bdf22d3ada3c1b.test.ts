import { listProgressDataByCondition } from '../../src/logic/data-persistence';
import type { ListProgressDataByConditionInput } from '../../src/logic/data-persistence';

describe('listProgressDataByCondition - SCEN-923 invalid sort column', () => {
  it('should return InvalidSortParameter error when sortBy has invalid column name', async () => {
    const input: ListProgressDataByConditionInput = {
      progressDataIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'invalidColumnName',
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    try {
      await listProgressDataByCondition(input);
      fail('Expected InvalidSortParameter error to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InvalidSortParameterError');
      expect(error.message).toBe('ソート対象カラムが不正です。有効なカラム名を指定してください。');
    }
  });
});