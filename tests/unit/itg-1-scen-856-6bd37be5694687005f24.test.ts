import {
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
} from '../../src/logic/data-persistence';
import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-856: 進捗率で昇順にソートして取得する', () => {
  it('should return allocation execution statuses sorted by progress rate in ascending order', async () => {
    // Arrange: テスト用の人員配置実行状況データを複数件準備
    const testData = [
      {
        allocationExecutionStatusId: 'status-1',
        allocationPlanId: 'plan-1',
        workInstructionId: 'instr-1',
        workerId: 'worker-1',
        facilityId: 'fac-1',
        teamId: 'team-1',
        allocationState: 'in_progress',
        plannedStartDateTime: '2024-01-10T09:00:00Z',
        plannedEndDateTime: '2024-01-10T17:00:00Z',
        actualStartDateTime: '2024-01-10T09:00:00Z',
        actualEndDateTime: undefined,
        plannedWorkHours: 8,
        actualWorkHours: 3,
        progressRate: 10,
        delayFlag: false,
        remarks: 'Just started',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        allocationExecutionStatusId: 'status-2',
        allocationPlanId: 'plan-2',
        workInstructionId: 'instr-2',
        workerId: 'worker-2',
        facilityId: 'fac-1',
        teamId: 'team-1',
        allocationState: 'in_progress',
        plannedStartDateTime: '2024-01-10T09:00:00Z',
        plannedEndDateTime: '2024-01-10T17:00:00Z',
        actualStartDateTime: '2024-01-10T09:00:00Z',
        actualEndDateTime: undefined,
        plannedWorkHours: 8,
        actualWorkHours: 2.8,
        progressRate: 35,
        delayFlag: false,
        remarks: 'On track',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T10:30:00Z',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        allocationExecutionStatusId: 'status-3',
        allocationPlanId: 'plan-3',
        workInstructionId: 'instr-3',
        workerId: 'worker-3',
        facilityId: 'fac-1',
        teamId: 'team-2',
        allocationState: 'in_progress',
        plannedStartDateTime: '2024-01-10T09:00:00Z',
        plannedEndDateTime: '2024-01-10T17:00:00Z',
        actualStartDateTime: '2024-01-10T09:00:00Z',
        actualEndDateTime: undefined,
        plannedWorkHours: 8,
        actualWorkHours: 4.8,
        progressRate: 60,
        delayFlag: false,
        remarks: 'Halfway through',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T11:00:00Z',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        allocationExecutionStatusId: 'status-4',
        allocationPlanId: 'plan-4',
        workInstructionId: 'instr-4',
        workerId: 'worker-4',
        facilityId: 'fac-2',
        teamId: 'team-2',
        allocationState: 'in_progress',
        plannedStartDateTime: '2024-01-10T09:00:00Z',
        plannedEndDateTime: '2024-01-10T17:00:00Z',
        actualStartDateTime: '2024-01-10T09:00:00Z',
        actualEndDateTime: undefined,
        plannedWorkHours: 8,
        actualWorkHours: 6.8,
        progressRate: 85,
        delayFlag: false,
        remarks: 'Almost done',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T11:30:00Z',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        allocationExecutionStatusId: 'status-5',
        allocationPlanId: 'plan-5',
        workInstructionId: 'instr-5',
        workerId: 'worker-5',
        facilityId: 'fac-2',
        teamId: 'team-3',
        allocationState: 'completed',
        plannedStartDateTime: '2024-01-10T09:00:00Z',
        plannedEndDateTime: '2024-01-10T17:00:00Z',
        actualStartDateTime: '2024-01-10T09:00:00Z',
        actualEndDateTime: '2024-01-10T17:00:00Z',
        plannedWorkHours: 8,
        actualWorkHours: 8,
        progressRate: 100,
        delayFlag: false,
        remarks: 'Completed',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T17:00:00Z',
        createdBy: 'user-1',
        updatedBy: 'user-2',
      },
    ];

    // Act: 入力条件を構築して関数を呼び出す
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
      sortBy: 'progressRate',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // Assert: 出力結果を検証
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.allocationExecutionStatuses.length).toBe(5);
    
    // 進捗率が昇順にソートされていることを検証
    expect(result.allocationExecutionStatuses[0].progressRate).toBe(10);
    expect(result.allocationExecutionStatuses[1].progressRate).toBe(35);
    expect(result.allocationExecutionStatuses[2].progressRate).toBe(60);
    expect(result.allocationExecutionStatuses[3].progressRate).toBe(85);
    expect(result.allocationExecutionStatuses[4].progressRate).toBe(100);

    // 各要素のフィールド値を検証
    expect(result.allocationExecutionStatuses[0].allocationExecutionStatusId).toBe('status-1');
    expect(result.allocationExecutionStatuses[0].allocationState).toBe('in_progress');
    expect(result.allocationExecutionStatuses[0].delayFlag).toBe(false);

    expect(result.allocationExecutionStatuses[4].allocationExecutionStatusId).toBe('status-5');
    expect(result.allocationExecutionStatuses[4].allocationState).toBe('completed');
    expect(result.allocationExecutionStatuses[4].progressRate).toBe(100);

    // ページネーション情報を検証
    expect(result.totalCount).toBe(5);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // retrievedAt が ISO 8601 形式の日時文字列であることを検証
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });
});