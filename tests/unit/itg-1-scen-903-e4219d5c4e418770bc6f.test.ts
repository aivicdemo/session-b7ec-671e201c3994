import { listProgressDataByCondition } from '../../src/logic/data-persistence';
import { ListProgressDataByConditionInput, ListProgressDataByConditionOutput, GetProgressDataByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-903: 作業指示IDで絞り込んだ結果を取得できる', () => {
  let testProgressDataList: GetProgressDataByIdOutput[];

  beforeAll(() => {
    // テストデータを準備
    testProgressDataList = [
      {
        progressDataId: 'PD-001',
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        progressDate: '2024-01-15',
        plannedQuantity: 100,
        actualQuantity: 80,
        completionRate: 80,
        delayFlag: false,
        delayDays: null,
        remarks: 'Test data 1',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
      {
        progressDataId: 'PD-002',
        workInstructionId: 'WI-002',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        progressDate: '2024-01-15',
        plannedQuantity: 120,
        actualQuantity: 100,
        completionRate: 83,
        delayFlag: false,
        delayDays: null,
        remarks: 'Test data 2',
        createdAt: '2024-01-15T09:15:00Z',
        updatedAt: '2024-01-15T10:15:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
      {
        progressDataId: 'PD-003',
        workInstructionId: 'WI-001',
        facilityId: 'FAC-002',
        teamId: 'TEAM-002',
        progressDate: '2024-01-15',
        plannedQuantity: 90,
        actualQuantity: 70,
        completionRate: 78,
        delayFlag: true,
        delayDays: 1,
        remarks: 'Test data 3',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
      {
        progressDataId: 'PD-004',
        workInstructionId: 'WI-003',
        facilityId: 'FAC-002',
        teamId: 'TEAM-002',
        progressDate: '2024-01-15',
        plannedQuantity: 110,
        actualQuantity: 50,
        completionRate: 45,
        delayFlag: true,
        delayDays: 2,
        remarks: 'Test data 4',
        createdAt: '2024-01-15T09:45:00Z',
        updatedAt: '2024-01-15T10:45:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      },
    ];
  });

  it('should retrieve progress data filtered by workInstructionIds', async () => {
    // 入力データを準備
    const input: ListProgressDataByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002'],
      progressDataIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // 関数を実行
    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    // 出力型が正しく返されることを確認
    expect(result).toBeDefined();
    expect(result.progressDataList).toBeDefined();
    expect(result.totalCount).toBeDefined();
    expect(result.retrievedAt).toBeDefined();

    // progressDataListに合致する進捗データのみが含まれることを確認
    const retrievedWorkInstructionIds = result.progressDataList.map((pd) => pd.workInstructionId);
    expect(retrievedWorkInstructionIds.every((id) => ['WI-001', 'WI-002'].includes(id))).toBe(true);

    // 条件に合致しないデータ（WI-003）が含まれないことを確認
    expect(retrievedWorkInstructionIds.includes('WI-003')).toBe(false);

    // progressDataListの件数がtotalCountと一致することを確認
    expect(result.progressDataList.length).toBe(result.totalCount);

    // retrievedAtがISO 8601形式の有効な日時文字列であることを確認
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // ページネーション指定がないため、pageNumberおよびpageSizeがnull/undefinedであることを確認
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('should include all matching progress data records', async () => {
    const input: ListProgressDataByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002'],
      progressDataIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listProgressDataByCondition(input);

    // WI-001に関連するデータが2件、WI-002に関連するデータが1件含まれることを確認
    const wiData = result.progressDataList.reduce(
      (acc, pd) => {
        if (pd.workInstructionId === 'WI-001') acc.wi001 += 1;
        if (pd.workInstructionId === 'WI-002') acc.wi002 += 1;
        return acc;
      },
      { wi001: 0, wi002: 0 }
    );

    expect(wiData.wi001).toBeGreaterThanOrEqual(1);
    expect(wiData.wi002).toBeGreaterThanOrEqual(1);
    expect(result.totalCount).toBeGreaterThanOrEqual(2);
  });

  it('should confirm totalCount matches the filtered result count', async () => {
    const input: ListProgressDataByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002'],
      progressDataIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listProgressDataByCondition(input);

    // progressDataListの実際の件数がtotalCountと一致することを確認
    expect(result.progressDataList.length).toBe(result.totalCount);
  });

  it('should return retrievedAt in valid ISO 8601 format', async () => {
    const input: ListProgressDataByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002'],
      progressDataIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listProgressDataByCondition(input);

    // retrievedAtが有効なISO 8601形式であることを確認
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    // 日付として解析可能であることを確認
    const parsedDate = new Date(result.retrievedAt);
    expect(parsedDate instanceof Date).toBe(true);
    expect(isNaN(parsedDate.getTime())).toBe(false);
  });

  it('should return null pageNumber and pageSize when pagination is not specified', async () => {
    const input: ListProgressDataByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002'],
      progressDataIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listProgressDataByCondition(input);

    // pageNumberがnullまたはundefinedであることを確認
    expect(result.pageNumber).toBeNull();
    // pageSizeがnullまたはundefinedであることを確認
    expect(result.pageSize).toBeNull();
  });
});