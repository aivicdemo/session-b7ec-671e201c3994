import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-913: listProgressDataByCondition - ソート機能', () => {
  it('sortBy="progressDate"、sortOrder="ASC"で昇順にソートされた結果を取得できる', async () => {
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
      sortBy: 'progressDate',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    const output = await listProgressDataByCondition(input);

    expect(output).toBeDefined();
    expect(output.progressDataList).toBeDefined();
    expect(Array.isArray(output.progressDataList)).toBe(true);
    expect(output.totalCount).toBeGreaterThanOrEqual(0);
    expect(output.pageNumber).toBe(1);
    expect(output.pageSize).toBe(10);
    expect(output.retrievedAt).toBeDefined();

    if (output.progressDataList.length > 1) {
      for (let i = 0; i < output.progressDataList.length - 1; i++) {
        const current = new Date(output.progressDataList[i].progressDate).getTime();
        const next = new Date(output.progressDataList[i + 1].progressDate).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    }
  });
});