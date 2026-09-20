import { listWorkersByCondition, ListWorkersByConditionInput, ListWorkersByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-613: listWorkersByConditionのレスポンス検証', () => {
  it('レスポンスに totalCountと retrievedAtが含まれている', async () => {
    // Arrange
    const input: ListWorkersByConditionInput = {
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workerNameKeyword: null,
      jobTypes: null,
      operatingStatuses: null,
      minHourlyRate: null,
      maxHourlyRate: null,
      minMaxWorkingHours: null,
      maxMaxWorkingHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result = await listWorkersByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.retrievedAt).toBe('string');
    
    // ISO 8601形式の検証
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
    
    // retrievedAtが現在の日時に近いことを確認（許容範囲：60秒以内）
    const retrievedAtTime = new Date(result.retrievedAt).getTime();
    const nowTime = new Date().getTime();
    const timeDiff = Math.abs(nowTime - retrievedAtTime);
    expect(timeDiff).toBeLessThanOrEqual(60000);
  });
});