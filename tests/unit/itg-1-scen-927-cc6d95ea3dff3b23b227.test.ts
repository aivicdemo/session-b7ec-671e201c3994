import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-927: 取得結果にデータ取得日時（ISO8601形式）が含まれる', () => {
  it('should return retrievedAt in ISO8601 format when no search conditions are specified', async () => {
    const beforeCall = new Date();
    
    const input = {
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: null,
      progressDateTo: null,
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

    const output = await listProgressDataByCondition(input);
    
    const afterCall = new Date();

    expect(output).toBeDefined();
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(output.retrievedAt).toMatch(iso8601Regex);

    const retrievedAtTime = new Date(output.retrievedAt);
    expect(retrievedAtTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 5000);
    expect(retrievedAtTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 5000);
  });
});