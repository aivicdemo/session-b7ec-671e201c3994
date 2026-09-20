import { describe, it, expect, beforeEach } from '@jest/globals';
import { listWorkResultsByCondition, ListWorkResultsByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-745: 実績数量の最小値が最大値より大きい場合、数値範囲不正エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidSearchConditionError when minActualQuantity > maxActualQuantity', async () => {
    const input: ListWorkResultsByConditionInput = {
      minActualQuantity: 100,
      maxActualQuantity: 50,
      pageNumber: 1,
      pageSize: 50,
    };

    try {
      await listWorkResultsByCondition(input);
      expect.fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('InvalidSearchConditionError');
      expect((error as Error).message).toBe('検索条件の日時または数値範囲が不正です。');
    }
  });

  it('should not return ListWorkResultsByConditionOutput when validation fails', async () => {
    const input: ListWorkResultsByConditionInput = {
      minActualQuantity: 100,
      maxActualQuantity: 50,
      pageNumber: 1,
      pageSize: 50,
    };

    let result: unknown;
    let caughtError: Error | null = null;

    try {
      result = await listWorkResultsByCondition(input);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.name).toBe('InvalidSearchConditionError');
    expect(result).toBeUndefined();
  });

  it('should throw InvalidSearchConditionError instead of InvalidPaginationError', async () => {
    const input: ListWorkResultsByConditionInput = {
      minActualQuantity: 100,
      maxActualQuantity: 50,
      pageNumber: 1,
      pageSize: 50,
    };

    let thrownError: Error | null = null;

    try {
      await listWorkResultsByCondition(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError?.name).toBe('InvalidSearchConditionError');
    expect(thrownError?.message).toBe('検索条件の日時または数値範囲が不正です。');
  });

  it('should validate minActualQuantity and maxActualQuantity before database access', async () => {
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['worker-1', 'worker-2'],
      facilityIds: ['facility-1'],
      teamIds: ['team-1'],
      workStatuses: ['completed'],
      minActualQuantity: 100,
      maxActualQuantity: 50,
      pageNumber: 1,
      pageSize: 50,
    };

    try {
      await listWorkResultsByCondition(input);
      expect.fail('Expected InvalidSearchConditionError to be thrown');
    } catch (error) {
      expect((error as Error).name).toBe('InvalidSearchConditionError');
      expect((error as Error).message).toBe('検索条件の日時または数値範囲が不正です。');
    }
  });

  it('should accept valid quantity ranges without error', async () => {
    const input: ListWorkResultsByConditionInput = {
      minActualQuantity: 50,
      maxActualQuantity: 100,
      pageNumber: 1,
      pageSize: 50,
    };

    try {
      await listWorkResultsByCondition(input);
    } catch (error) {
      if ((error as Error).name === 'InvalidSearchConditionError') {
        expect.fail('Should not throw InvalidSearchConditionError for valid range');
      }
    }
  });
});