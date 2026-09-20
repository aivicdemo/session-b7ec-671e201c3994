import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  listWorkInstructionReceptionHistoryByCondition,
  ListWorkInstructionReceptionHistoryByConditionInput,
  ListWorkInstructionReceptionHistoryByConditionOutput,
  GetWorkInstructionReceptionHistoryByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-1047: 代表的な検索条件で受領履歴一覧が正常に返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された検索条件に合致する作業指示受領履歴データの一覧を取得する', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionStatuses: ['pending', 'confirmed'],
      deliveryMethods: ['email', 'system_notification'],
      receptionDateFromDateTime: '2024-01-01T00:00:00Z',
      receptionDateToDateTime: '2024-01-31T23:59:59Z',
      sortBy: 'receptionDateTime',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeInstanceOf(Array);
    expect(result.receptionHistories.length).toBeLessThanOrEqual(10);

    if (result.receptionHistories.length > 0) {
      const firstItem = result.receptionHistories[0];
      expect(firstItem).toHaveProperty('receptionHistoryId');
      expect(firstItem).toHaveProperty('workInstructionId');
      expect(firstItem).toHaveProperty('workerId');
      expect(firstItem).toHaveProperty('receptionDateTime');
      expect(firstItem).toHaveProperty('receptionStatus');
      expect(firstItem).toHaveProperty('deliveryMethod');
      expect(firstItem).toHaveProperty('createdAt');
      expect(firstItem).toHaveProperty('updatedAt');
      expect(firstItem).toHaveProperty('createdBy');

      // 検索条件に合致するかを確認
      expect(input.receptionStatuses).toContain(firstItem.receptionStatus);
      expect(input.deliveryMethods).toContain(firstItem.deliveryMethod);

      const receptionDateTime = new Date(firstItem.receptionDateTime).getTime();
      const fromTime = new Date(input.receptionDateFromDateTime!).getTime();
      const toTime = new Date(input.receptionDateToDateTime!).getTime();
      expect(receptionDateTime).toBeGreaterThanOrEqual(fromTime);
      expect(receptionDateTime).toBeLessThanOrEqual(toTime);
    }

    // 全件数の検証
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.receptionHistories.length);

    // ページネーション設定の検証
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // retrievedAt の検証
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtTime = new Date(result.retrievedAt).getTime();
    const nowTime = Date.now();
    const timeDiffSeconds = Math.abs(nowTime - retrievedAtTime) / 1000;
    expect(timeDiffSeconds).toBeLessThan(60);

    // ソート順序の検証 (DESC)
    if (result.receptionHistories.length > 1) {
      for (let i = 0; i < result.receptionHistories.length - 1; i++) {
        const current = new Date(result.receptionHistories[i].receptionDateTime).getTime();
        const next = new Date(result.receptionHistories[i + 1].receptionDateTime).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it('バリデーション処理が正常に実行される', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionStatuses: ['pending'],
      receptionDateFromDateTime: '2024-01-01T00:00:00Z',
      receptionDateToDateTime: '2024-01-31T23:59:59Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('検索条件なしで全件を取得できる', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
  });

  it('ページネーション設定が正しく反映される', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      pageNumber: 2,
      pageSize: 5,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(5);
    expect(result.receptionHistories.length).toBeLessThanOrEqual(5);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('ソート順序が正しく反映される（昇順）', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      sortBy: 'receptionDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    if (result.receptionHistories.length > 1) {
      for (let i = 0; i < result.receptionHistories.length - 1; i++) {
        const current = new Date(result.receptionHistories[i].receptionDateTime).getTime();
        const next = new Date(result.receptionHistories[i + 1].receptionDateTime).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    }
  });

  it('複数の受領確認状態で検索できる', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionStatuses: ['pending', 'confirmed', 'rejected'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    if (result.receptionHistories.length > 0) {
      for (const history of result.receptionHistories) {
        expect(input.receptionStatuses).toContain(history.receptionStatus);
      }
    }
  });

  it('複数の配信方法で検索できる', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      deliveryMethods: ['handy_terminal', 'email', 'system_notification'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    if (result.receptionHistories.length > 0) {
      for (const history of result.receptionHistories) {
        expect(input.deliveryMethods).toContain(history.deliveryMethod);
      }
    }
  });

  it('日時範囲検索が正しく動作する', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionDateFromDateTime: '2024-01-01T00:00:00Z',
      receptionDateToDateTime: '2024-01-31T23:59:59Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    const fromTime = new Date(input.receptionDateFromDateTime!).getTime();
    const toTime = new Date(input.receptionDateToDateTime!).getTime();

    if (result.receptionHistories.length > 0) {
      for (const history of result.receptionHistories) {
        const historyTime = new Date(history.receptionDateTime).getTime();
        expect(historyTime).toBeGreaterThanOrEqual(fromTime);
        expect(historyTime).toBeLessThanOrEqual(toTime);
      }
    }
  });
});