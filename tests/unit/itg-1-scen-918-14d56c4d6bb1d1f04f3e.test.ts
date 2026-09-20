import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-918: 進捗日の開始日が終了日より後の場合、エラーを返す', () => {
  it('progressDateFromが「2024-01-20」、progressDateToが「2024-01-10」の場合、InvalidProgressDateRangeエラーを返す', async () => {
    const input = {
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: '2024-01-20',
      progressDateTo: '2024-01-10',
      minCompletionRate: null,
      maxCompletionRate: null,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDelayDays: null,
      maxDelayDays: null,
      delayFlagFilter: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    await expect(listProgressDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDateRangeError',
        message: '進捗日付範囲が不正です。開始日付は終了日付以前である必要があります。',
      })
    );
  });
});