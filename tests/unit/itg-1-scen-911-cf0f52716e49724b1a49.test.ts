import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-911: 作成日時の範囲で絞り込んだ進捗データ取得', () => {
  beforeEach(async () => {
    // テスト用の進捗データを事前準備
    const testData = [
      {
        progressDataId: 'prog-data-a',
        workInstructionId: 'work-inst-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        progressDate: '2024-01-15',
        plannedQuantity: 100,
        actualQuantity: 50,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        remarks: 'Test data A',
        createdAt: '2024-01-10T08:30:00Z',
        updatedAt: '2024-01-10T08:30:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        progressDataId: 'prog-data-b',
        workInstructionId: 'work-inst-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        progressDate: '2024-01-16',
        plannedQuantity: 100,
        actualQuantity: 75,
        completionRate: 75,
        delayFlag: false,
        delayDays: null,
        remarks: 'Test data B',
        createdAt: '2024-01-15T14:20:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        progressDataId: 'prog-data-c',
        workInstructionId: 'work-inst-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        progressDate: '2024-01-20',
        plannedQuantity: 100,
        actualQuantity: 90,
        completionRate: 90,
        delayFlag: false,
        delayDays: null,
        remarks: 'Test data C',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        progressDataId: 'prog-data-d',
        workInstructionId: 'work-inst-004',
        facilityId: 'facility-001',
        teamId: 'team-001',
        progressDate: '2024-01-25',
        plannedQuantity: 100,
        actualQuantity: 60,
        completionRate: 60,
        delayFlag: true,
        delayDays: 2,
        remarks: 'Test data D',
        createdAt: '2024-01-25T16:45:00Z',
        updatedAt: '2024-01-25T16:45:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
    ];

    // 注: 実際の環境ではデータベースに直接挿入
    // ここでは仮に保持するとする
    // await database.insertProgressData(testData);
  });

  it('作成日時の範囲内に該当する進捗データを取得できる', async () => {
    const result = await listProgressDataByCondition({
      createdFromDate: '2024-01-15T00:00:00Z',
      createdToDate: '2024-01-20T23:59:59Z',
      progressDataIds: undefined,
      workInstructionIds: undefined,
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
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    // 期待結果の検証
    expect(result.progressDataList).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // progressDataBとprogressDataCが含まれていることを確認
    const progressDataIds = result.progressDataList.map((p) => p.progressDataId);
    expect(progressDataIds).toContain('prog-data-b');
    expect(progressDataIds).toContain('prog-data-c');

    // 各進捗データの作成日時が指定範囲内であることを確認
    result.progressDataList.forEach((progressData) => {
      const createdAt = new Date(progressData.createdAt);
      const fromDate = new Date('2024-01-15T00:00:00Z');
      const toDate = new Date('2024-01-20T23:59:59Z');

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    // retrievedAtがISO 8601形式であることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });

  it('progressDataBの内容が正しいことを確認する', async () => {
    const result = await listProgressDataByCondition({
      createdFromDate: '2024-01-15T00:00:00Z',
      createdToDate: '2024-01-20T23:59:59Z',
    });

    const progressDataB = result.progressDataList.find(
      (p) => p.progressDataId === 'prog-data-b'
    );
    expect(progressDataB).toBeDefined();
    expect(progressDataB?.workInstructionId).toBe('work-inst-002');
    expect(progressDataB?.facilityId).toBe('facility-001');
    expect(progressDataB?.teamId).toBe('team-001');
    expect(progressDataB?.progressDate).toBe('2024-01-16');
    expect(progressDataB?.plannedQuantity).toBe(100);
    expect(progressDataB?.actualQuantity).toBe(75);
    expect(progressDataB?.completionRate).toBe(75);
    expect(progressDataB?.delayFlag).toBe(false);
    expect(progressDataB?.createdAt).toBe('2024-01-15T14:20:00Z');
    expect(progressDataB?.createdBy).toBe('user-001');
  });

  it('progressDataCの内容が正しいことを確認する', async () => {
    const result = await listProgressDataByCondition({
      createdFromDate: '2024-01-15T00:00:00Z',
      createdToDate: '2024-01-20T23:59:59Z',
    });

    const progressDataC = result.progressDataList.find(
      (p) => p.progressDataId === 'prog-data-c'
    );
    expect(progressDataC).toBeDefined();
    expect(progressDataC?.workInstructionId).toBe('work-inst-003');
    expect(progressDataC?.facilityId).toBe('facility-001');
    expect(progressDataC?.teamId).toBe('team-001');
    expect(progressDataC?.progressDate).toBe('2024-01-20');
    expect(progressDataC?.plannedQuantity).toBe(100);
    expect(progressDataC?.actualQuantity).toBe(90);
    expect(progressDataC?.completionRate).toBe(90);
    expect(progressDataC?.delayFlag).toBe(false);
    expect(progressDataC?.createdAt).toBe('2024-01-20T10:00:00Z');
    expect(progressDataC?.createdBy).toBe('user-001');
  });

  it('範囲外のデータ（progressDataAとprogressDataD）は含まれないこと', async () => {
    const result = await listProgressDataByCondition({
      createdFromDate: '2024-01-15T00:00:00Z',
      createdToDate: '2024-01-20T23:59:59Z',
    });

    const progressDataIds = result.progressDataList.map((p) => p.progressDataId);
    expect(progressDataIds).not.toContain('prog-data-a');
    expect(progressDataIds).not.toContain('prog-data-d');
  });
});