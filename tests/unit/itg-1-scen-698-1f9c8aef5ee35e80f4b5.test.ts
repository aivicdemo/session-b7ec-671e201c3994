import { listWorkInstructionsByCondition, ListWorkInstructionsByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-698: 取得時刻がISO 8601形式で返却される', () => {
  it('should return retrievedAt in ISO 8601 format when fetching work instructions', async () => {
    const searchCondition: ListWorkInstructionsByConditionInput = {
      facilityIds: ['F001'],
      progressStatuses: ['進行中'],
      pageNumber: 1,
      pageSize: 10,
      teamIds: null,
      workInstructionIds: null,
      workInstructionNumbers: null,
      workNameKeyword: null,
      priorities: null,
      minRequiredWorkerCount: null,
      maxRequiredWorkerCount: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
    };

    const testExecutionTime = new Date();

    const output = await listWorkInstructionsByCondition(searchCondition);

    expect(output).toBeDefined();
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(output.retrievedAt).toMatch(iso8601Regex);

    const retrievedDate = new Date(output.retrievedAt);
    expect(retrievedDate).toBeInstanceOf(Date);
    expect(retrievedDate.getTime()).not.toBeNaN();

    const timeDifference = Math.abs(retrievedDate.getTime() - testExecutionTime.getTime());
    expect(timeDifference).toBeLessThan(5000);

    const utcFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    const offsetFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/;

    const isValidFormat =
      utcFormatRegex.test(output.retrievedAt) ||
      offsetFormatRegex.test(output.retrievedAt);

    expect(isValidFormat).toBe(true);
  });
});