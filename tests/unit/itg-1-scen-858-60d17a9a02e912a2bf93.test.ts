import { listAllocationExecutionStatusByCondition, ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput, GetAllocationExecutionStatusByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-858: 計画開始日時でソートして取得する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return allocation execution statuses sorted by plannedStartDateTime in ascending order', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      sortBy: 'plannedStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
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
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // 1. allocationExecutionStatuses の順序を確認
    expect(result.allocationExecutionStatuses).toHaveLength(4);
    expect(result.allocationExecutionStatuses[0].allocationExecutionStatusId).toBe('AES002');
    expect(result.allocationExecutionStatuses[0].plannedStartDateTime).toBe('2024-01-05T09:00:00Z');
    
    expect(result.allocationExecutionStatuses[1].allocationExecutionStatusId).toBe('AES004');
    expect(result.allocationExecutionStatuses[1].plannedStartDateTime).toBe('2024-01-08T10:00:00Z');
    
    expect(result.allocationExecutionStatuses[2].allocationExecutionStatusId).toBe('AES001');
    expect(result.allocationExecutionStatuses[2].plannedStartDateTime).toBe('2024-01-10T08:00:00Z');
    
    expect(result.allocationExecutionStatuses[3].allocationExecutionStatusId).toBe('AES003');
    expect(result.allocationExecutionStatuses[3].plannedStartDateTime).toBe('2024-01-15T07:00:00Z');

    // 2. 各要素が GetAllocationExecutionStatusByIdOutput 型であることを確認
    result.allocationExecutionStatuses.forEach((item: GetAllocationExecutionStatusByIdOutput) => {
      expect(item).toHaveProperty('allocationExecutionStatusId');
      expect(item).toHaveProperty('allocationPlanId');
      expect(item).toHaveProperty('workInstructionId');
      expect(item).toHaveProperty('workerId');
      expect(item).toHaveProperty('facilityId');
      expect(item).toHaveProperty('teamId');
      expect(item).toHaveProperty('allocationState');
      expect(item).toHaveProperty('plannedStartDateTime');
      expect(item).toHaveProperty('plannedEndDateTime');
      expect(item).toHaveProperty('progressRate');
      expect(item).toHaveProperty('delayFlag');
    });

    // 3. totalCount を確認
    expect(result.totalCount).toBe(4);

    // 4. pageNumber と pageSize を確認
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // 5. retrievedAt が ISO8601 形式であることを確認
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('should verify progressRate and delayFlag values in sorted result', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      sortBy: 'plannedStartDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
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
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // 進捗率と遅延フラグの値を確認
    expect(result.allocationExecutionStatuses[0].progressRate).toBe(75);
    expect(result.allocationExecutionStatuses[0].delayFlag).toBe(false);

    expect(result.allocationExecutionStatuses[1].progressRate).toBe(60);
    expect(result.allocationExecutionStatuses[1].delayFlag).toBe(false);

    expect(result.allocationExecutionStatuses[2].progressRate).toBe(50);
    expect(result.allocationExecutionStatuses[2].delayFlag).toBe(false);

    expect(result.allocationExecutionStatuses[3].progressRate).toBe(30);
    expect(result.allocationExecutionStatuses[3].delayFlag).toBe(true);
  });
});