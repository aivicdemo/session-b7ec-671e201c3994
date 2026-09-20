import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import type { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-853: 作成日の範囲で絞り込んで取得する', () => {
  it('createdFromDate と createdToDate で指定した範囲内の人員配置実行状況データを取得する', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      createdFromDate: '2024-01-01',
      createdToDate: '2024-01-31',
      allocationExecutionStatusIds: null,
      allocationPlanIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      allocationStates: null,
      delayFlagFilter: null,
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
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // Assert
    // 出力型が正常に返されることを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationExecutionStatuses');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');

    // allocationExecutionStatuses が配列であることを確認
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // 取得されたすべてのデータが指定日範囲内に作成されていることを確認
    result.allocationExecutionStatuses.forEach((status) => {
      const createdAt = new Date(status.createdAt);
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31T23:59:59Z');
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    // totalCount が取得件数と一致することを確認
    expect(result.totalCount).toBe(result.allocationExecutionStatuses.length);

    // pageNumber と pageSize がページング非指定のため null または undefined であることを確認
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // retrievedAt が有効な ISO8601形式の日時文字列であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });

  it('createdFromDate のみ指定した場合、指定日以降のデータを取得する', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      createdFromDate: '2024-01-15',
      createdToDate: undefined,
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
    expect(result).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // 取得されたすべてのデータが 2024-01-15 以降に作成されていることを確認
    result.allocationExecutionStatuses.forEach((status) => {
      const createdAt = new Date(status.createdAt);
      const fromDate = new Date('2024-01-15');
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('createdToDate のみ指定した場合、指定日以前のデータを取得する', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      createdFromDate: undefined,
      createdToDate: '2024-01-31',
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
    expect(result).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // 取得されたすべてのデータが 2024-01-31 以前に作成されていることを確認
    result.allocationExecutionStatuses.forEach((status) => {
      const createdAt = new Date(status.createdAt);
      const toDate = new Date('2024-01-31T23:59:59Z');
      expect(createdAt.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('createdFromDate と createdToDate が同じ日付の場合、その日付のデータのみを取得する', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      createdFromDate: '2024-01-15',
      createdToDate: '2024-01-15',
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
    expect(result).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // 取得されたすべてのデータが 2024-01-15 のデータであることを確認
    result.allocationExecutionStatuses.forEach((status) => {
      const createdAt = new Date(status.createdAt);
      const targetDate = new Date('2024-01-15');
      expect(createdAt.getFullYear()).toBe(targetDate.getFullYear());
      expect(createdAt.getMonth()).toBe(targetDate.getMonth());
      expect(createdAt.getDate()).toBe(targetDate.getDate());
    });

    expect(result.retrievedAt).toBeDefined();
  });
});