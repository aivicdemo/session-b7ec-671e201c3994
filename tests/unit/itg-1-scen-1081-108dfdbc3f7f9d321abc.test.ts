import { describe, it, expect } from '@jest/globals';
import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1081: listHandyTerminalSyncLogByCondition - Invalid date range error', () => {
  it('should raise InvalidSearchConditionError when processingCompletedDateFromDateTime is after processingCompletedDateToDateTime', async () => {
    const input = {
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      syncStatuses: undefined,
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: '2024-01-15T10:00:00Z',
      processingCompletedDateToDateTime: '2024-01-10T10:00:00Z',
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listHandyTerminalSyncLogByCondition(input)).rejects.toMatchObject({
      name: 'InvalidSearchConditionError',
      message: expect.stringContaining('検索条件が無効です。日時範囲またはページネーション設定を確認してください。'),
    });
  });
});