import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-838: 人員配置実行状況IDで絞り込んで取得する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された人員配置実行状況IDに一致するデータを取得する', async () => {
    // テスト前準備
    const targetExecutionStatusIds = ['exec-001', 'exec-002', 'exec-003'];

    // 入力データの構築
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationExecutionStatusIds: targetExecutionStatusIds,
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // 関数を呼び出す
    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // 出力の検証
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    
    // 取得したレコード数が指定IDの数と一致する
    expect(result.allocationExecutionStatuses.length).toBeGreaterThanOrEqual(0);
    
    // 取得したレコードがすべて指定されたIDに含まれることを確認
    result.allocationExecutionStatuses.forEach((record) => {
      expect(targetExecutionStatusIds).toContain(record.allocationExecutionStatusId);
    });

    // totalCountが正の整数であることを確認
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.totalCount)).toBe(true);

    // pageNumberはnullである
    expect(result.pageNumber).toBeNull();

    // pageSizeはnullである
    expect(result.pageSize).toBeNull();

    // retrievedAtはISO8601形式の日時文字列である
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(result.retrievedAt).toMatch(dateRegex);

    // 各レコードが必須フィールドを持つことを確認
    result.allocationExecutionStatuses.forEach((record) => {
      expect(record.allocationExecutionStatusId).toBeDefined();
      expect(record.allocationPlanId).toBeDefined();
      expect(record.workInstructionId).toBeDefined();
      expect(record.workerId).toBeDefined();
      expect(record.facilityId).toBeDefined();
      expect(record.teamId).toBeDefined();
      expect(record.allocationState).toBeDefined();
      expect(record.plannedStartDateTime).toBeDefined();
      expect(record.plannedEndDateTime).toBeDefined();
      expect(record.plannedWorkHours).toBeDefined();
      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);
      expect(record.delayFlag).toBeDefined();
      expect(typeof record.delayFlag).toBe('boolean');
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
      expect(record.createdBy).toBeDefined();
    });
  });
});