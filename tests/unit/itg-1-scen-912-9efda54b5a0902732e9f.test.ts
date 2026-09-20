import { listProgressDataByCondition, ListProgressDataByConditionInput, ListProgressDataByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-912: 更新日時の範囲で絞り込んだ結果を取得できる', () => {
  it('should retrieve progress data filtered by updated date range', async () => {
    const input: ListProgressDataByConditionInput = {
      updatedFromDate: '2024-01-15T09:00:00Z',
      updatedToDate: '2024-01-20T18:00:00Z',
    };

    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    expect(result).toBeDefined();
    expect(result.progressDataList).toBeDefined();
    expect(Array.isArray(result.progressDataList)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    // Verify ISO 8601 format for retrievedAt
    expect(() => new Date(result.retrievedAt)).not.toThrow();
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.toISOString()).toBeDefined();

    // Verify totalCount matches actual progressDataList length
    expect(result.totalCount).toBe(result.progressDataList.length);

    // Verify all progress data falls within the specified date range
    const fromDate = new Date(input.updatedFromDate!);
    const toDate = new Date(input.updatedToDate!);

    result.progressDataList.forEach((progressData) => {
      expect(progressData.updatedAt).toBeDefined();
      const dataUpdatedAt = new Date(progressData.updatedAt);
      
      expect(dataUpdatedAt.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(dataUpdatedAt.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    // Verify pageNumber and pageSize
    // Since input doesn't specify pagination, they should be null/undefined or have default values
    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
    }
    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
    }
  });

  it('should verify each progress data contains required fields', async () => {
    const input: ListProgressDataByConditionInput = {
      updatedFromDate: '2024-01-15T09:00:00Z',
      updatedToDate: '2024-01-20T18:00:00Z',
    };

    const result = await listProgressDataByCondition(input);

    result.progressDataList.forEach((progressData) => {
      expect(progressData.progressDataId).toBeDefined();
      expect(typeof progressData.progressDataId).toBe('string');

      expect(progressData.workInstructionId).toBeDefined();
      expect(typeof progressData.workInstructionId).toBe('string');

      expect(progressData.facilityId).toBeDefined();
      expect(typeof progressData.facilityId).toBe('string');

      expect(progressData.teamId).toBeDefined();
      expect(typeof progressData.teamId).toBe('string');

      expect(progressData.progressDate).toBeDefined();
      expect(typeof progressData.progressDate).toBe('string');

      expect(progressData.plannedQuantity).toBeDefined();
      expect(typeof progressData.plannedQuantity).toBe('number');

      expect(progressData.actualQuantity).toBeDefined();
      expect(typeof progressData.actualQuantity).toBe('number');

      expect(progressData.createdAt).toBeDefined();
      expect(typeof progressData.createdAt).toBe('string');

      expect(progressData.updatedAt).toBeDefined();
      expect(typeof progressData.updatedAt).toBe('string');

      expect(progressData.createdBy).toBeDefined();
      expect(typeof progressData.createdBy).toBe('string');
    });
  });

  it('should return empty list when no data matches the date range', async () => {
    const input: ListProgressDataByConditionInput = {
      updatedFromDate: '2099-01-01T00:00:00Z',
      updatedToDate: '2099-12-31T23:59:59Z',
    };

    const result = await listProgressDataByCondition(input);

    expect(result.progressDataList).toBeDefined();
    expect(Array.isArray(result.progressDataList)).toBe(true);
    expect(result.totalCount).toBe(0);
    expect(result.progressDataList.length).toBe(0);
  });

  it('should maintain consistency between totalCount and progressDataList length', async () => {
    const input: ListProgressDataByConditionInput = {
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-12-31T23:59:59Z',
    };

    const result = await listProgressDataByCondition(input);

    expect(result.totalCount).toBe(result.progressDataList.length);
  });
});