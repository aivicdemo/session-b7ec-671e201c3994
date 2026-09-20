import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1094: 取得日時がISO 8601形式で返却される', () => {
  it('retrivedAtフィールドにISO 8601形式の日時文字列が返却される', async () => {
    const input = {
      handyTerminalSyncLogIds: null,
      workerIds: null,
      handyTerminalIds: null,
      facilityIds: null,
      syncTypes: null,
      syncStatuses: null,
      workInstructionIds: null,
      sentDateFromDateTime: null,
      sentDateToDateTime: null,
      receivedDateFromDateTime: null,
      receivedDateToDateTime: null,
      processingCompletedDateFromDateTime: null,
      processingCompletedDateToDateTime: null,
      minRetryCount: null,
      maxRetryCount: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listHandyTerminalSyncLogByCondition(input);

    expect(result.retrievedAt).toBeDefined();
    
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(iso8601Pattern);
  });

  it('retrievedAtがISO 8601形式のZタイムゾーン形式である場合も許容する', async () => {
    const input = {
      handyTerminalSyncLogIds: null,
      workerIds: null,
      handyTerminalIds: null,
      facilityIds: null,
      syncTypes: null,
      syncStatuses: null,
      workInstructionIds: null,
      sentDateFromDateTime: null,
      sentDateToDateTime: null,
      receivedDateFromDateTime: null,
      receivedDateToDateTime: null,
      processingCompletedDateFromDateTime: null,
      processingCompletedDateToDateTime: null,
      minRetryCount: null,
      maxRetryCount: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listHandyTerminalSyncLogByCondition(input);

    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
  });

  it('retrievedAtがISO 8601形式のオフセットタイムゾーン形式である場合も許容する', async () => {
    const input = {
      handyTerminalSyncLogIds: null,
      workerIds: null,
      handyTerminalIds: null,
      facilityIds: null,
      syncTypes: null,
      syncStatuses: null,
      workInstructionIds: null,
      sentDateFromDateTime: null,
      sentDateToDateTime: null,
      receivedDateFromDateTime: null,
      receivedDateToDateTime: null,
      processingCompletedDateFromDateTime: null,
      processingCompletedDateToDateTime: null,
      minRetryCount: null,
      maxRetryCount: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listHandyTerminalSyncLogByCondition(input);

    const offsetPattern = /[+-]\d{2}:\d{2}$/;
    const zPattern = /Z$/;
    const hasValidTimezone = offsetPattern.test(result.retrievedAt) || zPattern.test(result.retrievedAt);
    expect(hasValidTimezone).toBe(true);
  });

  it('retrievedAtが日付部分、T区切り文字、時刻部分で構成される', async () => {
    const input = {
      handyTerminalSyncLogIds: null,
      workerIds: null,
      handyTerminalIds: null,
      facilityIds: null,
      syncTypes: null,
      syncStatuses: null,
      workInstructionIds: null,
      sentDateFromDateTime: null,
      sentDateToDateTime: null,
      receivedDateFromDateTime: null,
      receivedDateToDateTime: null,
      processingCompletedDateFromDateTime: null,
      processingCompletedDateToDateTime: null,
      minRetryCount: null,
      maxRetryCount: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listHandyTerminalSyncLogByCondition(input);

    expect(result.retrievedAt).toContain('T');
    
    const parts = result.retrievedAt.split('T');
    expect(parts).toHaveLength(2);
    
    const datePart = parts[0];
    const timePart = parts[1];
    
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const timePattern = /^\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
    
    expect(datePart).toMatch(datePattern);
    expect(timePart).toMatch(timePattern);
  });
});