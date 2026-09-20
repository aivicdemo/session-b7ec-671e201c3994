import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  GetAllocationExecutionStatusByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-866: 人員配置実行状況の検索 - 計画と実績のギャップが出力に含まれる', () => {
  it('指定された検索条件に合致する人員配置実行状況データの一覧を取得し、計画と実績のギャップ情報を提供する', async () => {
    // Arrange: モックデータの準備
    const mockRecord1: GetAllocationExecutionStatusByIdOutput = {
      allocationExecutionStatusId: 'exec-001',
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      allocationState: '実行中',
      plannedStartDateTime: '2024-01-15T09:00:00Z',
      plannedEndDateTime: '2024-01-15T17:00:00Z',
      actualStartDateTime: '2024-01-15T09:15:00Z',
      actualEndDateTime: '2024-01-15T15:30:00Z',
      plannedWorkHours: 8.0,
      actualWorkHours: 6.5,
      progressRate: 81,
      delayFlag: false,
      remarks: 'テスト用レコード1',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T16:00:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-001',
    };

    const mockRecord2: GetAllocationExecutionStatusByIdOutput = {
      allocationExecutionStatusId: 'exec-002',
      allocationPlanId: 'plan-002',
      workInstructionId: 'instr-002',
      workerId: 'worker-002',
      facilityId: 'fac-001',
      teamId: 'team-001',
      allocationState: '実行中',
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-15T18:00:00Z',
      actualStartDateTime: '2024-01-15T08:00:00Z',
      actualEndDateTime: '2024-01-15T20:30:00Z',
      plannedWorkHours: 10.0,
      actualWorkHours: 12.5,
      progressRate: 100,
      delayFlag: true,
      remarks: 'テスト用レコード2',
      createdAt: '2024-01-15T07:00:00Z',
      updatedAt: '2024-01-15T20:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-001',
    };

    const mockRecord3: GetAllocationExecutionStatusByIdOutput = {
      allocationExecutionStatusId: 'exec-003',
      allocationPlanId: 'plan-003',
      workInstructionId: 'instr-003',
      workerId: 'worker-003',
      facilityId: 'fac-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-15T10:00:00Z',
      plannedEndDateTime: '2024-01-15T15:00:00Z',
      actualStartDateTime: '2024-01-15T14:00:00Z',
      actualEndDateTime: undefined,
      plannedWorkHours: 5.0,
      actualWorkHours: 2.0,
      progressRate: 40,
      delayFlag: true,
      remarks: 'テスト用レコード3',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

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
      pageNumber: 1,
      pageSize: 10,
    };

    // Act: 公開処理を呼び出す
    const result = await listAllocationExecutionStatusByCondition(input);

    // Assert: 出力検証
    // 1. allocationExecutionStatuses 配列が返されること
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // 2. 各レコードが計画と実績のギャップ情報を含むこと
    expect(result.allocationExecutionStatuses.length).toBeGreaterThanOrEqual(3);

    // レコード1の検証: 工数ギャップ -1.5時間、開始時間15分遅延、終了時間1.5時間早期完了
    const record1 = result.allocationExecutionStatuses.find(
      (r) => r.allocationExecutionStatusId === 'exec-001'
    );
    expect(record1).toBeDefined();
    if (record1) {
      expect(record1.plannedWorkHours).toBe(8.0);
      expect(record1.actualWorkHours).toBe(6.5);
      // 工数差分: 6.5 - 8.0 = -1.5
      const workHoursDiff = (record1.actualWorkHours ?? 0) - record1.plannedWorkHours;
      expect(workHoursDiff).toBeCloseTo(-1.5, 1);

      // 開始時間差分: 2024-01-15T09:15:00Z - 2024-01-15T09:00:00Z = 900秒
      const plannedStart = new Date(record1.plannedStartDateTime).getTime();
      const actualStart = record1.actualStartDateTime
        ? new Date(record1.actualStartDateTime).getTime()
        : null;
      if (actualStart !== null) {
        const startDiffSeconds = (actualStart - plannedStart) / 1000;
        expect(startDiffSeconds).toBe(900); // 15分
      }

      // 終了時間差分: 15:30 - 17:00 = -1.5時間
      const plannedEnd = new Date(record1.plannedEndDateTime).getTime();
      const actualEnd = record1.actualEndDateTime
        ? new Date(record1.actualEndDateTime).getTime()
        : null;
      if (actualEnd !== null) {
        const endDiffHours = (actualEnd - plannedEnd) / (1000 * 60 * 60);
        expect(endDiffHours).toBeCloseTo(-1.5, 1);
      }
    }

    // レコード2の検証: 工数ギャップ +2.5時間、開始時間0秒、終了時間+2.5時間超過
    const record2 = result.allocationExecutionStatuses.find(
      (r) => r.allocationExecutionStatusId === 'exec-002'
    );
    expect(record2).toBeDefined();
    if (record2) {
      expect(record2.plannedWorkHours).toBe(10.0);
      expect(record2.actualWorkHours).toBe(12.5);
      // 工数差分: 12.5 - 10.0 = +2.5
      const workHoursDiff = (record2.actualWorkHours ?? 0) - record2.plannedWorkHours;
      expect(workHoursDiff).toBeCloseTo(2.5, 1);

      // 開始時間差分: 2024-01-15T08:00:00Z - 2024-01-15T08:00:00Z = 0秒
      const plannedStart = new Date(record2.plannedStartDateTime).getTime();
      const actualStart = record2.actualStartDateTime
        ? new Date(record2.actualStartDateTime).getTime()
        : null;
      if (actualStart !== null) {
        const startDiffSeconds = (actualStart - plannedStart) / 1000;
        expect(startDiffSeconds).toBe(0);
      }

      // 終了時間差分: 20:30 - 18:00 = +2.5時間
      const plannedEnd = new Date(record2.plannedEndDateTime).getTime();
      const actualEnd = record2.actualEndDateTime
        ? new Date(record2.actualEndDateTime).getTime()
        : null;
      if (actualEnd !== null) {
        const endDiffHours = (actualEnd - plannedEnd) / (1000 * 60 * 60);
        expect(endDiffHours).toBeCloseTo(2.5, 1);
      }
    }

    // レコード3の検証: 工数ギャップ -3.0時間、開始時間+4時間遅延、終了時間未確定
    const record3 = result.allocationExecutionStatuses.find(
      (r) => r.allocationExecutionStatusId === 'exec-003'
    );
    expect(record3).toBeDefined();
    if (record3) {
      expect(record3.plannedWorkHours).toBe(5.0);
      expect(record3.actualWorkHours).toBe(2.0);
      // 工数差分: 2.0 - 5.0 = -3.0
      const workHoursDiff = (record3.actualWorkHours ?? 0) - record3.plannedWorkHours;
      expect(workHoursDiff).toBeCloseTo(-3.0, 1);

      // 開始時間差分: 2024-01-15T14:00:00Z - 2024-01-15T10:00:00Z = 14400秒 (4時間)
      const plannedStart = new Date(record3.plannedStartDateTime).getTime();
      const actualStart = record3.actualStartDateTime
        ? new Date(record3.actualStartDateTime).getTime()
        : null;
      if (actualStart !== null) {
        const startDiffSeconds = (actualStart - plannedStart) / 1000;
        expect(startDiffSeconds).toBe(14400);
      }

      // 終了時間: 未確定（null）
      expect(record3.actualEndDateTime).toBeUndefined();
    }

    // 3. totalCount が正確であること
    expect(result.totalCount).toBeGreaterThanOrEqual(3);

    // 4. ページネーション情報が正確であること
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // 5. retrievedAt が ISO8601形式の現在時刻に近い値であること
    expect(result.retrievedAt).toBeDefined();
    const retrievedAt = new Date(result.retrievedAt);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - retrievedAt.getTime());
    expect(timeDiff).toBeLessThan(10000); // 10秒以内
  });
});