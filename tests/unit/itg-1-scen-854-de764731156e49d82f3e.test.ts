import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
  GetAllocationExecutionStatusByIdOutput,
} from '../../src/logic/data-persistence';

describe('listAllocationExecutionStatusByCondition - 更新日の範囲で絞り込んで取得する', () => {
  it('更新日の範囲で絞り込んだ人員配置実行状況データの一覧を取得できること', async () => {
    // Arrange
    const input: ListAllocationExecutionStatusByConditionInput = {
      updatedFromDate: '2024-01-15',
      updatedToDate: '2024-01-20',
    };

    const mockRecord1: GetAllocationExecutionStatusByIdOutput = {
      allocationExecutionStatusId: 'aes-001',
      allocationPlanId: 'ap-001',
      workInstructionId: 'wi-001',
      workerId: 'w-001',
      facilityId: 'f-001',
      teamId: 't-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-15T17:00:00Z',
      actualStartDateTime: '2024-01-15T08:05:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: 4,
      progressRate: 50,
      delayFlag: false,
      remarks: 'テストレコード1',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-16T10:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    const mockRecord2: GetAllocationExecutionStatusByIdOutput = {
      allocationExecutionStatusId: 'aes-002',
      allocationPlanId: 'ap-002',
      workInstructionId: 'wi-002',
      workerId: 'w-002',
      facilityId: 'f-002',
      teamId: 't-002',
      allocationState: '完了',
      plannedStartDateTime: '2024-01-17T08:00:00Z',
      plannedEndDateTime: '2024-01-17T17:00:00Z',
      actualStartDateTime: '2024-01-17T08:00:00Z',
      actualEndDateTime: '2024-01-17T17:00:00Z',
      plannedWorkHours: 8,
      actualWorkHours: 8,
      progressRate: 100,
      delayFlag: false,
      remarks: 'テストレコード2',
      createdAt: '2024-01-17T08:00:00Z',
      updatedAt: '2024-01-17T17:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    const mockRecord3: GetAllocationExecutionStatusByIdOutput = {
      allocationExecutionStatusId: 'aes-003',
      allocationPlanId: 'ap-003',
      workInstructionId: 'wi-003',
      workerId: 'w-003',
      facilityId: 'f-003',
      teamId: 't-003',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-19T08:00:00Z',
      plannedEndDateTime: '2024-01-19T17:00:00Z',
      actualStartDateTime: '2024-01-19T08:00:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: 3,
      progressRate: 37,
      delayFlag: true,
      remarks: 'テストレコード3',
      createdAt: '2024-01-19T08:00:00Z',
      updatedAt: '2024-01-20T14:00:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    // Act
    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toBeDefined();

    // 戻り値の各レコードが更新日の範囲内であることを確認
    result.allocationExecutionStatuses.forEach((record) => {
      expect(record.updatedAt).toBeDefined();
      const updatedDate = new Date(record.updatedAt);
      const fromDate = new Date('2024-01-15');
      const toDate = new Date('2024-01-20');
      toDate.setHours(23, 59, 59, 999);

      expect(updatedDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(updatedDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    // retrievedAtがISO8601形式であることを確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/.test(result.retrievedAt)).toBe(true);
  });
});