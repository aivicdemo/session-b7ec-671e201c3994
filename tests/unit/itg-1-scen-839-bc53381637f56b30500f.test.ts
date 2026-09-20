import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import type { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-839: 人員配置案IDで絞り込んで取得する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された人員配置案IDに合致する配置実行ステータス一覧を取得する', async () => {
    // テスト前提条件
    const existingData = {
      'PLAN-001': [
        {
          allocationExecutionStatusId: 'EXEC-001',
          allocationPlanId: 'PLAN-001',
          workInstructionId: 'WI-001',
          workerId: 'W-001',
          facilityId: 'F-001',
          teamId: 'T-001',
          allocationState: 'in_progress',
          plannedStartDateTime: '2024-01-15T08:00:00Z',
          plannedEndDateTime: '2024-01-15T17:00:00Z',
          actualStartDateTime: '2024-01-15T08:05:00Z',
          actualEndDateTime: null,
          plannedWorkHours: 8,
          actualWorkHours: null,
          progressRate: 45,
          delayFlag: false,
          remarks: null,
          createdAt: '2024-01-15T07:55:00Z',
          updatedAt: '2024-01-15T12:30:00Z',
          createdBy: 'U-001',
          updatedBy: null,
        },
        {
          allocationExecutionStatusId: 'EXEC-002',
          allocationPlanId: 'PLAN-001',
          workInstructionId: 'WI-002',
          workerId: 'W-002',
          facilityId: 'F-001',
          teamId: 'T-001',
          allocationState: 'completed',
          plannedStartDateTime: '2024-01-15T08:00:00Z',
          plannedEndDateTime: '2024-01-15T16:00:00Z',
          actualStartDateTime: '2024-01-15T08:10:00Z',
          actualEndDateTime: '2024-01-15T16:00:00Z',
          plannedWorkHours: 8,
          actualWorkHours: 7.83,
          progressRate: 100,
          delayFlag: false,
          remarks: null,
          createdAt: '2024-01-15T07:55:00Z',
          updatedAt: '2024-01-15T16:05:00Z',
          createdBy: 'U-001',
          updatedBy: null,
        },
        {
          allocationExecutionStatusId: 'EXEC-003',
          allocationPlanId: 'PLAN-001',
          workInstructionId: 'WI-003',
          workerId: 'W-003',
          facilityId: 'F-001',
          teamId: 'T-002',
          allocationState: 'pending',
          plannedStartDateTime: '2024-01-15T14:00:00Z',
          plannedEndDateTime: '2024-01-15T22:00:00Z',
          actualStartDateTime: null,
          actualEndDateTime: null,
          plannedWorkHours: 8,
          actualWorkHours: null,
          progressRate: 0,
          delayFlag: false,
          remarks: null,
          createdAt: '2024-01-15T13:50:00Z',
          updatedAt: '2024-01-15T13:50:00Z',
          createdBy: 'U-001',
          updatedBy: null,
        },
      ],
      'PLAN-002': [
        {
          allocationExecutionStatusId: 'EXEC-004',
          allocationPlanId: 'PLAN-002',
          workInstructionId: 'WI-004',
          workerId: 'W-004',
          facilityId: 'F-002',
          teamId: 'T-003',
          allocationState: 'in_progress',
          plannedStartDateTime: '2024-01-16T08:00:00Z',
          plannedEndDateTime: '2024-01-16T17:00:00Z',
          actualStartDateTime: '2024-01-16T08:00:00Z',
          actualEndDateTime: null,
          plannedWorkHours: 8,
          actualWorkHours: null,
          progressRate: 30,
          delayFlag: true,
          remarks: null,
          createdAt: '2024-01-15T17:00:00Z',
          updatedAt: '2024-01-16T12:00:00Z',
          createdBy: 'U-001',
          updatedBy: null,
        },
        {
          allocationExecutionStatusId: 'EXEC-005',
          allocationPlanId: 'PLAN-002',
          workInstructionId: 'WI-005',
          workerId: 'W-005',
          facilityId: 'F-002',
          teamId: 'T-003',
          allocationState: 'pending',
          plannedStartDateTime: '2024-01-16T10:00:00Z',
          plannedEndDateTime: '2024-01-16T18:00:00Z',
          actualStartDateTime: null,
          actualEndDateTime: null,
          plannedWorkHours: 8,
          actualWorkHours: null,
          progressRate: 0,
          delayFlag: false,
          remarks: null,
          createdAt: '2024-01-15T17:00:00Z',
          updatedAt: '2024-01-15T17:00:00Z',
          createdBy: 'U-001',
          updatedBy: null,
        },
      ],
      'PLAN-003': [
        {
          allocationExecutionStatusId: 'EXEC-006',
          allocationPlanId: 'PLAN-003',
          workInstructionId: 'WI-006',
          workerId: 'W-006',
          facilityId: 'F-003',
          teamId: 'T-004',
          allocationState: 'completed',
          plannedStartDateTime: '2024-01-17T08:00:00Z',
          plannedEndDateTime: '2024-01-17T16:00:00Z',
          actualStartDateTime: '2024-01-17T08:00:00Z',
          actualEndDateTime: '2024-01-17T15:30:00Z',
          plannedWorkHours: 8,
          actualWorkHours: 7.5,
          progressRate: 100,
          delayFlag: false,
          remarks: 'Early completion',
          createdAt: '2024-01-16T17:00:00Z',
          updatedAt: '2024-01-17T16:00:00Z',
          createdBy: 'U-001',
          updatedBy: null,
        },
      ],
    };

    // 入力パラメータを設定
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationPlanIds: ['PLAN-001'],
      allocationExecutionStatusIds: undefined,
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

    // 対象処理を呼び出す
    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // 戻り値を検証する
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.allocationExecutionStatuses).toHaveLength(3);

    // PLAN-001 に属するすべての配置実行ステータスが含まれていることを確認
    const statusIds = result.allocationExecutionStatuses.map(s => s.allocationExecutionStatusId);
    expect(statusIds).toContain('EXEC-001');
    expect(statusIds).toContain('EXEC-002');
    expect(statusIds).toContain('EXEC-003');

    // PLAN-002, PLAN-003 の配置実行ステータスが含まれていないことを確認
    expect(statusIds).not.toContain('EXEC-004');
    expect(statusIds).not.toContain('EXEC-005');
    expect(statusIds).not.toContain('EXEC-006');

    // 各要素の構造を検証
    result.allocationExecutionStatuses.forEach(status => {
      expect(status.allocationExecutionStatusId).toBeDefined();
      expect(status.allocationPlanId).toBe('PLAN-001');
      expect(status.workInstructionId).toBeDefined();
      expect(status.workerId).toBeDefined();
      expect(status.facilityId).toBeDefined();
      expect(status.teamId).toBeDefined();
      expect(status.allocationState).toBeDefined();
      expect(status.plannedStartDateTime).toBeDefined();
      expect(status.plannedEndDateTime).toBeDefined();
      expect(typeof status.progressRate).toBe('number');
      expect(typeof status.delayFlag).toBe('boolean');
      expect(status.createdAt).toBeDefined();
      expect(status.updatedAt).toBeDefined();
    });

    // totalCount を検証
    expect(result.totalCount).toBe(3);

    // ページング情報が未指定のため undefined であることを確認
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();

    // retrievedAt が ISO8601 形式であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // ISO8601 形式の検証
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(isoDateRegex.test(result.retrievedAt)).toBe(true);
  });
});