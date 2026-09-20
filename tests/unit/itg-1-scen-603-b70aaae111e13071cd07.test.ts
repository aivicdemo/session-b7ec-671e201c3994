import { listWorkersByCondition } from '../../src/logic/data-persistence';
import type { ListWorkersByConditionInput, ListWorkersByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-603: 作業者名キーワードで部分一致検索した作業者一覧が正常に返される', () => {
  it('should return workers matching the workerNameKeyword filter', async () => {
    // Arrange
    const input: ListWorkersByConditionInput = {
      workerNameKeyword: '太郎',
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    // Assert
    // 1. Check that all workers in the result have '太郎' in their name
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);

    result.workers.forEach((worker) => {
      expect(worker.workerName).toContain('太郎');
    });

    // 2. Check that totalCount is a non-negative integer representing the total count
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(Number.isInteger(result.totalCount)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(result.workers.length);

    // 3. Check that retrievedAt is in ISO 8601 format
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    // 4. Check that pageNumber and pageSize are null or undefined
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('should return empty workers array when no matches are found', async () => {
    // Arrange
    const input: ListWorkersByConditionInput = {
      workerNameKeyword: '存在しない名前_' + Math.random().toString(36).substring(7),
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    // Assert
    expect(result.workers).toBeDefined();
    expect(result.workers).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('should handle partial name matching with various Japanese characters', async () => {
    // Arrange
    const input: ListWorkersByConditionInput = {
      workerNameKeyword: '郎',
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    // Assert
    expect(result.workers).toBeDefined();
    result.workers.forEach((worker) => {
      expect(worker.workerName).toContain('郎');
    });
    expect(result.totalCount).toBeGreaterThanOrEqual(result.workers.length);
    expect(result.retrievedAt).toBeDefined();
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });
});