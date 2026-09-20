import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-791: listAllocationPlansByCondition - Invalid Sort Field', () => {
  it('should throw InvalidSortParameterError when sortBy specifies a non-existent field', async () => {
    const invalidInput = {
      sortBy: 'nonExistentField',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(listAllocationPlansByCondition(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: 'ソート対象フィールドまたはソート順序が無効です。',
      })
    );
  });
});