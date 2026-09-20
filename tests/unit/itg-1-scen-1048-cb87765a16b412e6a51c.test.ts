import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';
import { ListWorkInstructionReceptionHistoryByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-1048: 受領日時の検索開始日時が終了日時より後の場合、日時範囲エラーが発生する', () => {
  it('should throw InvalidSearchConditionError when receptionDateFromDateTime is later than receptionDateToDateTime', async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      receptionStatuses: undefined,
      deliveryMethods: undefined,
      receptionDateFromDateTime: '2024-12-31T23:59:59Z',
      receptionDateToDateTime: '2024-12-25T10:00:00Z',
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

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toThrow(/検索条件の日時または数値範囲が不正です。/);
  });
});