import { listProgressDataByCondition, ListProgressDataByConditionInput, ListProgressDataByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-905: チームIDで絞り込んだ結果を取得できる', () => {
  it('should return progress data filtered by teamIds', async () => {
    const teamIds = ['team-001', 'team-002'];
    const input: ListProgressDataByConditionInput = {
      teamIds,
      facilityIds: undefined,
      workInstructionIds: undefined,
      progressDataIds: undefined,
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const output: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    expect(output.progressDataList).toBeDefined();
    expect(Array.isArray(output.progressDataList)).toBe(true);

    if (output.progressDataList.length > 0) {
      output.progressDataList.forEach((progressData) => {
        expect(teamIds).toContain(progressData.teamId);
      });
    }

    expect(output.totalCount).toBe(output.progressDataList.length);

    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(output.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeGreaterThan(0);
    expect(output.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});