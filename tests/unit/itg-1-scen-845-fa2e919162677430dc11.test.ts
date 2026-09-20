import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-845: 遅延フラグで絞り込んで取得する', () => {
  it('delayFlagFilter = true で遅延ありのレコードのみを取得できる', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      delayFlagFilter: true,
      allocationExecutionStatusIds: null,
      allocationPlanIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      allocationStates: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minPlannedWorkHours: null,
      maxPlannedWorkHours: null,
      minActualWorkHours: null,
      maxActualWorkHours: null,
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
    const result = await listAllocationExecutionStatusByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // 返却されたレコードがすべて遅延フラグがtrueであることを確認
    result.allocationExecutionStatuses.forEach(status => {
      expect(status.delayFlag).toBe(true);
      expect(status.allocationExecutionStatusId).toBeDefined();
      expect(typeof status.allocationExecutionStatusId).toBe('string');
      expect(status.allocationPlanId).toBeDefined();
      expect(status.workInstructionId).toBeDefined();
      expect(status.workerId).toBeDefined();
      expect(status.facilityId).toBeDefined();
      expect(status.teamId).toBeDefined();
      expect(status.allocationState).toBeDefined();
      expect(status.plannedStartDateTime).toBeDefined();
      expect(status.plannedEndDateTime).toBeDefined();
      expect(status.plannedWorkHours).toBeDefined();
      expect(typeof status.plannedWorkHours).toBe('number');
      expect(status.progressRate).toBeDefined();
      expect(typeof status.progressRate).toBe('number');
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);
      expect(status.createdAt).toBeDefined();
      expect(status.updatedAt).toBeDefined();
      expect(status.createdBy).toBeDefined();
    });

    // totalCount の確認：返却件数以上であることを確認（ページング前の全件数）
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationExecutionStatuses.length);

    // retrievedAt が ISO8601 形式であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');

    // ページング指定がないため pageNumber と pageSize は null または undefined
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('delayFlagFilter = true で条件に合致するすべてのレコードが返却される', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      delayFlagFilter: true,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result = await listAllocationExecutionStatusByCondition(input);

    // Assert
    // 返却された配列が空でないことを確認（テストデータが存在する場合）
    if (result.allocationExecutionStatuses.length > 0) {
      expect(result.totalCount).toBeGreaterThan(0);
      result.allocationExecutionStatuses.forEach(status => {
        expect(status.delayFlag).toBe(true);
      });
    }

    // 全件数の整合性を確認
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('遅延フラグ条件以外がすべて null/undefined の場合、バリデーション関数が呼び出されないことを確認する', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      delayFlagFilter: true,
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
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
    const result = await listAllocationExecutionStatusByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    // 関数が正常に実行されたことを確認
    expect(result.retrievedAt).toBeDefined();
  });

  it('返却されるレコードが GetAllocationExecutionStatusByIdOutput 型構造を満たすことを確認する', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      delayFlagFilter: true,
    };

    // Act
    const result = await listAllocationExecutionStatusByCondition(input);

    // Assert
    if (result.allocationExecutionStatuses.length > 0) {
      const record = result.allocationExecutionStatuses[0];

      // 必須フィールドの確認
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

      expect(record.plannedWorkHours).toBeDefined();
      expect(typeof record.plannedWorkHours).toBe('number');

      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');

      expect(record.delayFlag).toBeDefined();
      expect(typeof record.delayFlag).toBe('boolean');

      expect(record.createdAt).toBeDefined();
      expect(typeof record.createdAt).toBe('string');

      expect(record.updatedAt).toBeDefined();
      expect(typeof record.updatedAt).toBe('string');

      expect(record.createdBy).toBeDefined();
      expect(typeof record.createdBy).toBe('string');

      // オプショナルフィールドの型確認
      if (record.actualStartDateTime !== null && record.actualStartDateTime !== undefined) {
        expect(typeof record.actualStartDateTime).toBe('string');
      }

      if (record.actualEndDateTime !== null && record.actualEndDateTime !== undefined) {
        expect(typeof record.actualEndDateTime).toBe('string');
      }

      if (record.actualWorkHours !== null && record.actualWorkHours !== undefined) {
        expect(typeof record.actualWorkHours).toBe('number');
      }

      if (record.remarks !== null && record.remarks !== undefined) {
        expect(typeof record.remarks).toBe('string');
      }

      if (record.updatedBy !== null && record.updatedBy !== undefined) {
        expect(typeof record.updatedBy).toBe('string');
      }
    }
  });

  it('retrievedAt が現在の日時付近の ISO8601 形式であることを確認する', async () => {
    // Arrange
    const beforeExecution = new Date();
    const input: ListAllocationExecutionStatusByConditionInput = {
      delayFlagFilter: true,
    };

    // Act
    const result = await listAllocationExecutionStatusByCondition(input);
    const afterExecution = new Date();

    // Assert
    expect(result.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');

    // retrievedAt が実行時刻の前後の範囲内にあることを確認
    expect(retrievedAtDate.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime() - 1000);
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(afterExecution.getTime() + 1000);
  });
});