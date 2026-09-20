import { listProgressDataByCondition } from '../../src/logic/data-persistence';
import { ListProgressDataByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-924: listProgressDataByCondition ページネーションパラメータ検証', () => {
  it('ページ番号が1未満の場合、エラーを返す', async () => {
    const input: ListProgressDataByConditionInput = {
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
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 0,
      pageSize: 10,
    };

    let error: Error | null = null;

    try {
      await listProgressDataByCondition(input);
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toBe(
      'ページネーションパラメータが不正です。ページ番号とページサイズは1以上である必要があります。'
    );
  });
});