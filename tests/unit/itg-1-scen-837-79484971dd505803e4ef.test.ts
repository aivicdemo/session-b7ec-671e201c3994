import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-837: 検索条件なしで全件取得する', () => {
  it('should return all allocation execution status records when no search conditions are specified', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minPlannedWorkHours: undefined,
      maxPlannedWorkHours: undefined,
      minActualWorkHours: undefined,
      maxActualWorkHours: undefined,
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
    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // Assert
    // 検索条件が指定されていないため、出力型の構造を確認
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    
    // ページング指定がない場合、pageNumber と pageSize は null または undefined
    expect(result.pageNumber === null || result.pageNumber === undefined).toBe(true);
    expect(result.pageSize === null || result.pageSize === undefined).toBe(true);

    // retrievedAt は ISO8601 形式の日時文字列であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoDateRegex.test(result.retrievedAt)).toBe(true);

    // 各レコードが GetAllocationExecutionStatusByIdOutput 型に準拠していることを確認
    result.allocationExecutionStatuses.forEach((record) => {
      expect(record.allocationExecutionStatusId).toBeDefined();
      expect(typeof record.allocationExecutionStatusId).toBe('string');

      expect(record.allocationPlanId).toBeDefined();
      expect(typeof record.allocationPlanId).toBe('string');

      expect(record.workInstructionId).toBeDefined();
      expect(typeof record.workInstructionId).toBe('string');

      expect(record.workerId).toBeDefined();
      expect(typeof record.workerId).toBe('string');

      expect(record.facilityId).toBeDefined();
      expect(typeof record.facilityId).toBe('string');

      expect(record.teamId).toBeDefined();
      expect(typeof record.teamId).toBe('string');

      expect(record.allocationState).toBeDefined();
      expect(typeof record.allocationState).toBe('string');

      expect(record.plannedStartDateTime).toBeDefined();
      expect(typeof record.plannedStartDateTime).toBe('string');

      expect(record.plannedEndDateTime).toBeDefined();
      expect(typeof record.plannedEndDateTime).toBe('string');

      // actualStartDateTime と actualEndDateTime は null/undefined の場合がある
      if (record.actualStartDateTime !== undefined && record.actualStartDateTime !== null) {
        expect(typeof record.actualStartDateTime).toBe('string');
      }
      if (record.actualEndDateTime !== undefined && record.actualEndDateTime !== null) {
        expect(typeof record.actualEndDateTime).toBe('string');
      }

      expect(record.plannedWorkHours).toBeDefined();
      expect(typeof record.plannedWorkHours).toBe('number');

      expect(record.actualWorkHours === null || record.actualWorkHours === undefined || typeof record.actualWorkHours === 'number').toBe(true);

      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);

      expect(record.delayFlag).toBeDefined();
      expect(typeof record.delayFlag).toBe('boolean');

      expect(record.createdAt).toBeDefined();
      expect(typeof record.createdAt).toBe('string');

      expect(record.updatedAt).toBeDefined();
      expect(typeof record.updatedAt).toBe('string');

      expect(record.createdBy).toBeDefined();
      expect(typeof record.createdBy).toBe('string');

      // updatedBy は null/undefined の場合がある
      if (record.updatedBy !== undefined && record.updatedBy !== null) {
        expect(typeof record.updatedBy).toBe('string');
      }

      // 計画と実績のギャップを確認
      if (record.actualWorkHours !== null && record.actualWorkHours !== undefined) {
        const gap = record.plannedWorkHours - record.actualWorkHours;
        expect(typeof gap).toBe('number');
      }

      // 遅延フラグが適切に設定されていることを確認
      expect(record.delayFlag === true || record.delayFlag === false).toBe(true);
    });
  });
});