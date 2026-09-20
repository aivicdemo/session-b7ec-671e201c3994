import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-922: 遅延日数の最小値が最大値より大きい場合、エラーを返す', () => {
  it('should throw InvalidDelayDaysRange when minDelayDays is greater than maxDelayDays', async () => {
    const input = {
      progressDataIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: 10,
      maxDelayDays: 5,
      delayFlagFilter: undefined,
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
      await listProgressDataByCondition(input);
      fail('Expected InvalidDelayDaysRange to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).name).toBe('InvalidDelayDaysRange');
      expect((error as any).message).toBe('遅延日数の範囲が不正です。最小値は最大値以下である必要があります。');
    }
  });
});