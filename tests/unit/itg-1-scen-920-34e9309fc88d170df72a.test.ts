import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-920: 完了率の最大値が0～100の範囲外の場合、エラーを返す', () => {
  it('maxCompletionRateが101の場合、InvalidCompletionRateRangeエラーをスローする', async () => {
    const input = {
      progressDataIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: 101,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
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

    await expect(listProgressDataByCondition(input)).rejects.toThrow(
      '完了率の範囲が不正です。0～100の値を指定してください。'
    );
  });
});