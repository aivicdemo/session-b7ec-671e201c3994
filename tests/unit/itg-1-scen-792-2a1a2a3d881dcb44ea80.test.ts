import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';
import { ListAllocationPlansByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-792: ソート順序が有効値以外の場合のエラー処理', () => {
  it('sortOrderが"INVALID"の場合、InvalidSortParameterErrorをスローすること', async () => {
    const input: ListAllocationPlansByConditionInput = {
      sortOrder: 'INVALID',
      sortBy: 'allocationStartDate',
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: expect.stringContaining('ソート対象フィールドまたはソート順序が無効です。'),
      })
    );
  });

  it('sortOrderが"asc"（小文字）の場合、InvalidSortParameterErrorをスローすること', async () => {
    const input: ListAllocationPlansByConditionInput = {
      sortOrder: 'asc',
      sortBy: 'estimatedCompletionDate',
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: expect.stringContaining('ソート対象フィールドまたはソート順序が無効です。'),
      })
    );
  });

  it('sortOrderが"desc"（小文字）の場合、InvalidSortParameterErrorをスローすること', async () => {
    const input: ListAllocationPlansByConditionInput = {
      sortOrder: 'desc',
      sortBy: 'status',
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: expect.stringContaining('ソート対象フィールドまたはソート順序が無効です。'),
      })
    );
  });

  it('sortOrderが空文字列の場合、InvalidSortParameterErrorをスローすること', async () => {
    const input: ListAllocationPlansByConditionInput = {
      sortOrder: '',
      sortBy: 'createdAt',
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: expect.stringContaining('ソート対象フィールドまたはソート順序が無効です。'),
      })
    );
  });

  it('sortOrderが数値型の場合、InvalidSortParameterErrorをスローすること', async () => {
    const input = {
      sortOrder: 123,
      sortBy: 'allocationStartDate',
    } as unknown as ListAllocationPlansByConditionInput;

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: expect.stringContaining('ソート対象フィールドまたはソート順序が無効です。'),
      })
    );
  });

  it('sortOrderが"ASC"または"DESC"の場合、正常なListAllocationPlansByConditionOutputを返すこと（他パラメータは有効値）', async () => {
    const input: ListAllocationPlansByConditionInput = {
      sortOrder: 'ASC',
      sortBy: 'allocationStartDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listAllocationPlansByCondition(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
  });

  it('sortOrderが"DESC"の場合、正常なListAllocationPlansByConditionOutputを返すこと', async () => {
    const input: ListAllocationPlansByConditionInput = {
      sortOrder: 'DESC',
      sortBy: 'estimatedCompletionDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listAllocationPlansByCondition(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');
  });

  it('sortOrderが"ASC"で、sortByが無効な値の場合、InvalidSortParameterErrorをスローすること', async () => {
    const input: ListAllocationPlansByConditionInput = {
      sortOrder: 'ASC',
      sortBy: 'invalidFieldName',
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: expect.stringContaining('ソート対象フィールドまたはソート順序が無効です。'),
      })
    );
  });
});