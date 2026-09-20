import { listProgressDataByCondition, ListProgressDataByConditionInput, ListProgressDataByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-907: 完了率の範囲で絞り込んだ結果を取得できる', () => {
  it('should retrieve progress data within completion rate range', async () => {
    const input: ListProgressDataByConditionInput = {
      minCompletionRate: 50,
      maxCompletionRate: 80,
      progressDataIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    expect(result).toBeDefined();
    expect(result.progressDataList).toBeDefined();
    expect(Array.isArray(result.progressDataList)).toBe(true);

    result.progressDataList.forEach((progressData) => {
      expect(progressData.completionRate).toBeDefined();
      expect(typeof progressData.completionRate).toBe('number');
      expect(progressData.completionRate).toBeGreaterThanOrEqual(50);
      expect(progressData.completionRate).toBeLessThanOrEqual(80);
    });

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(result.progressDataList.length);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);

    const retrievedTime = new Date(result.retrievedAt).getTime();
    const now = Date.now();
    const timeDifference = Math.abs(now - retrievedTime);
    expect(timeDifference).toBeLessThan(60000);
  });
});