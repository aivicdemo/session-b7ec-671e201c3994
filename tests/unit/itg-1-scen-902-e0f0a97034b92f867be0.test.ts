import { listProgressDataByCondition } from '../../src/logic/data-persistence';
import type { ListProgressDataByConditionInput, ListProgressDataByConditionOutput, GetProgressDataByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-902: 進捗データIDで絞り込んだ結果を取得できる', () => {
  it('progressDataIds を指定して listProgressDataByCondition を呼び出し、合致する進捗データを返却する', async () => {
    // Arrange
    const input: ListProgressDataByConditionInput = {
      progressDataIds: ['PD-001', 'PD-002', 'PD-003'],
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const output: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    // Assert
    expect(output).toBeDefined();
    expect(Array.isArray(output.progressDataList)).toBe(true);
    expect(output.progressDataList.length).toBe(3);

    const returnedIds = output.progressDataList.map((item: GetProgressDataByIdOutput) => item.progressDataId);
    expect(returnedIds).toEqual(expect.arrayContaining(['PD-001', 'PD-002', 'PD-003']));

    expect(output.totalCount).toBe(3);

    expect(output.pageNumber).toBeNull();
    expect(output.pageSize).toBeNull();

    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.retrievedAt)).toBe(true);

    output.progressDataList.forEach((progressData: GetProgressDataByIdOutput) => {
      expect(['PD-001', 'PD-002', 'PD-003']).toContain(progressData.progressDataId);
      expect(progressData.workInstructionId).toBeDefined();
      expect(progressData.facilityId).toBeDefined();
      expect(progressData.teamId).toBeDefined();
      expect(progressData.progressDate).toBeDefined();
      expect(progressData.plannedQuantity).toBeDefined();
      expect(progressData.actualQuantity).toBeDefined();
    });
  });
});