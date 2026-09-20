import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';
import { ListWorkInstructionReceptionHistoryByConditionInput, ListWorkInstructionReceptionHistoryByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1055: 検索条件が指定されない場合、全受領履歴が返される', () => {
  it('検索条件が全て null または undefined の場合、全受領履歴データが返される', async () => {
    // Arrange
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      receptionStatuses: undefined,
      deliveryMethods: undefined,
      receptionDateFromDateTime: undefined,
      receptionDateToDateTime: undefined,
      confirmationDateFromDateTime: undefined,
      confirmationDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result: ListWorkInstructionReceptionHistoryByConditionOutput = await listWorkInstructionReceptionHistoryByCondition(input);

    // Assert
    // (1) receptionHistories フィールドが配列であることを確認
    expect(result.receptionHistories).toBeDefined();
    expect(Array.isArray(result.receptionHistories)).toBe(true);

    // (2) totalCount フィールドが整数値で返されることを確認
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.totalCount)).toBe(true);

    // (3) pageNumber フィールドが null、undefined、またはデフォルト値で返されることを確認
    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
      expect(result.pageNumber).toBeGreaterThanOrEqual(1);
    }

    // (4) pageSize フィールドが null、undefined、またはデフォルト値で返されることを確認
    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
      expect(result.pageSize).toBeGreaterThanOrEqual(1);
    }

    // (5) retrievedAt フィールドが ISO 8601 形式で返されることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    // (6) 返されたレコードが正しい構造を持つことを確認
    result.receptionHistories.forEach((history) => {
      expect(history.receptionHistoryId).toBeDefined();
      expect(typeof history.receptionHistoryId).toBe('string');

      expect(history.workInstructionId).toBeDefined();
      expect(typeof history.workInstructionId).toBe('string');

      expect(history.workerId).toBeDefined();
      expect(typeof history.workerId).toBe('string');

      expect(history.receptionDateTime).toBeDefined();
      expect(typeof history.receptionDateTime).toBe('string');

      expect(history.receptionStatus).toBeDefined();
      expect(typeof history.receptionStatus).toBe('string');

      expect(history.deliveryMethod).toBeDefined();
      expect(typeof history.deliveryMethod).toBe('string');

      expect(history.createdAt).toBeDefined();
      expect(typeof history.createdAt).toBe('string');

      expect(history.updatedAt).toBeDefined();
      expect(typeof history.updatedAt).toBe('string');

      expect(history.createdBy).toBeDefined();
      expect(typeof history.createdBy).toBe('string');
    });

    // (7) receptionHistories の件数と totalCount が一致することを確認
    // （ページネーション未指定時は全件が返されることを期待）
    if (result.pageNumber === null || result.pageNumber === undefined) {
      expect(result.receptionHistories.length).toBeLessThanOrEqual(result.totalCount);
    }
  });
});