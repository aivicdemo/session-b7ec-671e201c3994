import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput, GetAllocationExecutionStatusByIdOutput } from '../../src/logic/data-persistence';

describe('作業指示IDで絞り込んで取得する', () => {
  let mockDatabaseQuery: jest.Mock;
  let validateReferentialIntegrityStub: jest.Mock;
  let validateDateTimeRangeStub: jest.Mock;
  let validateNumericQuantityStub: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    validateReferentialIntegrityStub = jest.fn().mockResolvedValue(undefined);
    validateDateTimeRangeStub = jest.fn().mockResolvedValue(undefined);
    validateNumericQuantityStub = jest.fn().mockResolvedValue(undefined);

    mockDatabaseQuery = jest.fn();
  });

  it('指定された作業指示IDに合致する人員配置実行状況データを取得する', async () => {
    // テスト用の人員配置実行状況データを事前準備
    const testData: GetAllocationExecutionStatusByIdOutput[] = [
      {
        allocationExecutionStatusId: 'AES-001',
        allocationPlanId: 'AP-001',
        workInstructionId: 'WI-001',
        workerId: 'W-001',
        facilityId: 'F-001',
        teamId: 'T-001',
        allocationState: '未開始',
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        plannedWorkHours: 8,
        actualWorkHours: null,
        progressRate: 0,
        delayFlag: false,
        remarks: 'テスト用配置実行状況1',
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T07:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        allocationExecutionStatusId: 'AES-002',
        allocationPlanId: 'AP-001',
        workInstructionId: 'WI-001',
        workerId: 'W-002',
        facilityId: 'F-001',
        teamId: 'T-001',
        allocationState: '進行中',
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        actualStartDateTime: '2024-01-15T08:15:00Z',
        actualEndDateTime: null,
        plannedWorkHours: 8,
        actualWorkHours: 2.5,
        progressRate: 35,
        delayFlag: false,
        remarks: 'テスト用配置実行状況2',
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
    ];

    const otherWorkInstructionData: GetAllocationExecutionStatusByIdOutput[] = [
      {
        allocationExecutionStatusId: 'AES-003',
        allocationPlanId: 'AP-002',
        workInstructionId: 'WI-002',
        workerId: 'W-003',
        facilityId: 'F-001',
        teamId: 'T-002',
        allocationState: '完了',
        plannedStartDateTime: '2024-01-14T08:00:00Z',
        plannedEndDateTime: '2024-01-14T17:00:00Z',
        actualStartDateTime: '2024-01-14T08:00:00Z',
        actualEndDateTime: '2024-01-14T16:45:00Z',
        plannedWorkHours: 8,
        actualWorkHours: 8.75,
        progressRate: 100,
        delayFlag: false,
        remarks: 'テスト用配置実行状況3',
        createdAt: '2024-01-14T07:00:00Z',
        updatedAt: '2024-01-14T17:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
    ];

    mockDatabaseQuery.mockResolvedValue(testData);

    // validateReferentialIntegrityスタブの設定
    validateReferentialIntegrityStub.mockResolvedValue(undefined);

    // 検索条件を準備
    const input: ListAllocationExecutionStatusByConditionInput = {
      workInstructionIds: ['WI-001'],
      allocationPlanIds: undefined,
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

    // 関数を呼び出す
    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // 期待結果を検証
    expect(result.allocationExecutionStatuses).toHaveLength(2);
    expect(result.allocationExecutionStatuses).toEqual(testData);
    expect(result.allocationExecutionStatuses[0].workInstructionId).toBe('WI-001');
    expect(result.allocationExecutionStatuses[1].workInstructionId).toBe('WI-001');
    expect(result.allocationExecutionStatuses.every(item => item.workInstructionId === 'WI-001')).toBe(true);

    // 計画と実績のギャップを確認
    expect(result.allocationExecutionStatuses[0].plannedWorkHours).toBe(8);
    expect(result.allocationExecutionStatuses[0].actualWorkHours).toBeNull();
    expect(result.allocationExecutionStatuses[1].plannedWorkHours).toBe(8);
    expect(result.allocationExecutionStatuses[1].actualWorkHours).toBe(2.5);

    // 進捗率を確認
    expect(result.allocationExecutionStatuses[0].progressRate).toBe(0);
    expect(result.allocationExecutionStatuses[1].progressRate).toBe(35);

    // 遅延フラグを確認
    expect(result.allocationExecutionStatuses[0].delayFlag).toBe(false);
    expect(result.allocationExecutionStatuses[1].delayFlag).toBe(false);

    // totalCountが正確に反映されていることを確認
    expect(result.totalCount).toBe(2);

    // ページングが指定されていないため、pageNumberとpageSizeはnullまたはundefinedであることを確認
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // retrievedAtがISO8601形式であることを確認
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 他の作業指示IDのレコードが含まれていないことを確認
    expect(result.allocationExecutionStatuses.some(item => item.workInstructionId === 'WI-002')).toBe(false);
    expect(result.allocationExecutionStatuses.some(item => item.workInstructionId === 'WI-003')).toBe(false);
  });
});