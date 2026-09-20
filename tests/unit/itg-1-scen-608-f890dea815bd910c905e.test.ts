import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-608: 作成日時範囲で絞り込んだ作業者一覧が正常に返される', () => {
  it('should return workers filtered by createdFromDate and createdToDate', async () => {
    // Arrange
    const createdFromDate = '2024-01-01T00:00:00Z';
    const createdToDate = '2024-01-31T23:59:59Z';

    const input = {
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
      createdFromDate,
      createdToDate,
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
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);

    // Verify all returned workers have createdAt within the specified date range
    result.workers.forEach((worker) => {
      const workerCreatedAt = new Date(worker.createdAt).getTime();
      const fromTime = new Date(createdFromDate).getTime();
      const toTime = new Date(createdToDate).getTime();

      expect(workerCreatedAt).toBeGreaterThanOrEqual(fromTime);
      expect(workerCreatedAt).toBeLessThanOrEqual(toTime);
    });

    // Verify totalCount matches the returned workers array length
    expect(result.totalCount).toBe(result.workers.length);

    // Verify retrievedAt is in ISO 8601 format and is a valid date
    expect(result.retrievedAt).toBeDefined();
    const retrievedTime = new Date(result.retrievedAt);
    expect(retrievedTime.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify pagination fields are null/undefined since no pagination was specified
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });
});