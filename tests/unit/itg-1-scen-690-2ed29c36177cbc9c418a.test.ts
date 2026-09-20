import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-690: listWorkInstructionsByCondition - Invalid numeric range validation', () => {
  test('should throw InvalidSearchConditionError when minRequiredWorkerCount is greater than maxRequiredWorkerCount', async () => {
    const invalidCondition = {
      minRequiredWorkerCount: 10,
      maxRequiredWorkerCount: 5,
    };

    await expect(listWorkInstructionsByCondition(invalidCondition)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSearchConditionError',
        message: '検索条件が不正です。日時範囲と数値範囲を確認してください。',
      })
    );
  });

  test('should not execute database query when numeric range validation fails', async () => {
    const invalidCondition = {
      minRequiredWorkerCount: 10,
      maxRequiredWorkerCount: 5,
    };

    try {
      await listWorkInstructionsByCondition(invalidCondition);
      fail('Expected InvalidSearchConditionError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InvalidSearchConditionError');
      expect(error.message).toBe('検索条件が不正です。日時範囲と数値範囲を確認してください。');
    }
  });
});