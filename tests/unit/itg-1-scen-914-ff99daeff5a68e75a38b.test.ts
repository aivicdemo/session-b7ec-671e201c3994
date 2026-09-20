import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-914: 指定したカラムで降順にソートした結果を取得できる', () => {
  it('progressDate を降順でソートした結果を取得する', async () => {
    const input = {
      progressDataIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'progressDate',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listProgressDataByCondition(input);

    expect(result.progressDataList).toBeDefined();
    expect(Array.isArray(result.progressDataList)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);

    if (result.progressDataList.length > 1) {
      for (let i = 0; i < result.progressDataList.length - 1; i++) {
        const current = result.progressDataList[i];
        const next = result.progressDataList[i + 1];

        expect(current.progressDate).toBeDefined();
        expect(next.progressDate).toBeDefined();

        const currentDate = new Date(current.progressDate).getTime();
        const nextDate = new Date(next.progressDate).getTime();

        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    }

    result.progressDataList.forEach((item) => {
      expect(item.progressDataId).toBeDefined();
      expect(typeof item.progressDataId).toBe('string');
      expect(item.workInstructionId).toBeDefined();
      expect(typeof item.workInstructionId).toBe('string');
      expect(item.facilityId).toBeDefined();
      expect(typeof item.facilityId).toBe('string');
      expect(item.teamId).toBeDefined();
      expect(typeof item.teamId).toBe('string');
      expect(item.progressDate).toBeDefined();
      expect(typeof item.progressDate).toBe('string');
      expect(item.plannedQuantity).toBeDefined();
      expect(typeof item.plannedQuantity).toBe('number');
      expect(item.actualQuantity).toBeDefined();
      expect(typeof item.actualQuantity).toBe('number');
      expect(item.createdAt).toBeDefined();
      expect(typeof item.createdAt).toBe('string');
      expect(item.updatedAt).toBeDefined();
      expect(typeof item.updatedAt).toBe('string');
      expect(item.createdBy).toBeDefined();
      expect(typeof item.createdBy).toBe('string');
    });
  });
});