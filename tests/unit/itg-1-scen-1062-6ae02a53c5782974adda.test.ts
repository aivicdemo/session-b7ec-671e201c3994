import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1062: データ取得日時がISO 8601形式で返される', () => {
  it('should return retrievedAt in ISO 8601 format', async () => {
    const input = {
      receptionHistoryIds: null,
      workInstructionIds: ['WI-001'],
      workerIds: null,
      receptionStatuses: null,
      deliveryMethods: null,
      receptionDateFromDateTime: null,
      receptionDateToDateTime: null,
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const output = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(output).toBeDefined();
    expect(output.retrievedAt).toBeDefined();

    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)$/;
    expect(output.retrievedAt).toMatch(iso8601Pattern);
  });
});