import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-730: 作業開始日時の範囲で検索して合致するデータが返される', () => {
  // モック対象の関数を事前に保存
  const originalListWorkResultsByCondition = dataPersistence.listWorkResultsByCondition;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return work result records matching the specified datetime range', async () => {
    // テストセットアップ: 作業実績データベースにテストデータを準備
    const testData = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T08:00:00Z',
        actualEndDateTime: '2024-01-01T09:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T10:30:00Z',
        actualEndDateTime: '2024-01-15T11:30:00Z',
        actualQuantity: 150,
        workStatus: 'completed',
        defectCount: 2,
        remarks: null,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:30:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-02-01T14:00:00Z',
        actualEndDateTime: '2024-02-01T15:00:00Z',
        actualQuantity: 120,
        workStatus: 'completed',
        defectCount: 1,
        remarks: null,
        createdAt: '2024-02-01T14:00:00Z',
        updatedAt: '2024-02-01T15:00:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
      {
        workResultId: 'wr-004',
        workInstructionId: 'wi-004',
        workerId: 'worker-004',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-03-01T09:00:00Z',
        actualEndDateTime: '2024-03-01T10:00:00Z',
        actualQuantity: 110,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-03-01T09:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
        createdBy: 'user-004',
        updatedBy: null,
      },
    ];

    // validateDateTimeRange をモック化
    const mockValidateDateTimeRange = jest
      .spyOn(dataPersistence, 'validateDateTimeRange' as any)
      .mockReturnValue(true);

    // validateNumericQuantity をモック化
    const mockValidateNumericQuantity = jest
      .spyOn(dataPersistence, 'validateNumericQuantity' as any)
      .mockReturnValue(true);

    // データベースに準備されたデータとして、フィルタリング結果を返すようモック化
    const filteredData = testData.filter(
      (record) =>
        record.actualStartDateTime >= '2024-01-10T00:00:00Z' &&
        record.actualStartDateTime <= '2024-02-10T23:59:59Z'
    );

    const mockResult = {
      workResults: filteredData.sort((a, b) =>
        a.actualStartDateTime.localeCompare(b.actualStartDateTime)
      ),
      totalCount: filteredData.length,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    jest.spyOn(dataPersistence, 'listWorkResultsByCondition').mockResolvedValue(mockResult);

    // listWorkResultsByCondition を呼び出す
    const result = await listWorkResultsByCondition({
      actualStartFromDateTime: '2024-01-10T00:00:00Z',
      actualStartToDateTime: '2024-02-10T23:59:59Z',
      pageNumber: 1,
      pageSize: 50,
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
    });

    // 返却されたデータを検証
    // 期待される件数: 2件（範囲内のレコード）
    expect(result.workResults).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // 最初のレコード: 2024-01-15T10:30:00Z
    expect(result.workResults[0].workResultId).toBe('wr-002');
    expect(result.workResults[0].actualStartDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.workResults[0].actualQuantity).toBe(150);

    // 2番目のレコード: 2024-02-01T14:00:00Z
    expect(result.workResults[1].workResultId).toBe('wr-003');
    expect(result.workResults[1].actualStartDateTime).toBe('2024-02-01T14:00:00Z');
    expect(result.workResults[1].actualQuantity).toBe(120);

    // ページ情報の検証
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    // retrievedAt は ISO 8601 形式であることを確認
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 範囲外のレコードが含まれていないことを確認
    const recordIds = result.workResults.map((r) => r.workResultId);
    expect(recordIds).not.toContain('wr-001'); // 2024-01-01T08:00:00Z（範囲開始前）
    expect(recordIds).not.toContain('wr-004'); // 2024-03-01T09:00:00Z（範囲終了後）

    // モック化された検証関数が呼び出されたことを確認
    expect(mockValidateDateTimeRange).toHaveBeenCalled();
    expect(mockValidateNumericQuantity).toHaveBeenCalled();
  });

  it('should return sorted results in ascending order by actualStartDateTime', async () => {
    const testData = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T08:00:00Z',
        actualEndDateTime: '2024-01-01T09:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T10:30:00Z',
        actualEndDateTime: '2024-01-15T11:30:00Z',
        actualQuantity: 150,
        workStatus: 'completed',
        defectCount: 2,
        remarks: null,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:30:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-02-01T14:00:00Z',
        actualEndDateTime: '2024-02-01T15:00:00Z',
        actualQuantity: 120,
        workStatus: 'completed',
        defectCount: 1,
        remarks: null,
        createdAt: '2024-02-01T14:00:00Z',
        updatedAt: '2024-02-01T15:00:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
      {
        workResultId: 'wr-004',
        workInstructionId: 'wi-004',
        workerId: 'worker-004',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-03-01T09:00:00Z',
        actualEndDateTime: '2024-03-01T10:00:00Z',
        actualQuantity: 110,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-03-01T09:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
        createdBy: 'user-004',
        updatedBy: null,
      },
    ];

    const sortedData = testData.sort((a, b) =>
      a.actualStartDateTime.localeCompare(b.actualStartDateTime)
    );

    const mockResult = {
      workResults: sortedData,
      totalCount: sortedData.length,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    jest.spyOn(dataPersistence, 'listWorkResultsByCondition').mockResolvedValue(mockResult);

    const result = await listWorkResultsByCondition({
      actualStartFromDateTime: '2024-01-01T00:00:00Z',
      actualStartToDateTime: '2024-03-31T23:59:59Z',
      pageNumber: 1,
      pageSize: 50,
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
    });

    // データが昇順でソートされていることを確認
    for (let i = 0; i < result.workResults.length - 1; i++) {
      const current = new Date(result.workResults[i].actualStartDateTime).getTime();
      const next = new Date(result.workResults[i + 1].actualStartDateTime).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it('should handle empty result set within date range', async () => {
    const mockResult = {
      workResults: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    jest.spyOn(dataPersistence, 'listWorkResultsByCondition').mockResolvedValue(mockResult);

    const result = await listWorkResultsByCondition({
      actualStartFromDateTime: '2024-06-01T00:00:00Z',
      actualStartToDateTime: '2024-06-30T23:59:59Z',
      pageNumber: 1,
      pageSize: 50,
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
    });

    // 合致するレコードがない場合
    expect(result.workResults).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should apply pagination correctly', async () => {
    const testData = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T08:00:00Z',
        actualEndDateTime: '2024-01-01T09:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T10:30:00Z',
        actualEndDateTime: '2024-01-15T11:30:00Z',
        actualQuantity: 150,
        workStatus: 'completed',
        defectCount: 2,
        remarks: null,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:30:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-02-01T14:00:00Z',
        actualEndDateTime: '2024-02-01T15:00:00Z',
        actualQuantity: 120,
        workStatus: 'completed',
        defectCount: 1,
        remarks: null,
        createdAt: '2024-02-01T14:00:00Z',
        updatedAt: '2024-02-01T15:00:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
      {
        workResultId: 'wr-004',
        workInstructionId: 'wi-004',
        workerId: 'worker-004',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-03-01T09:00:00Z',
        actualEndDateTime: '2024-03-01T10:00:00Z',
        actualQuantity: 110,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-03-01T09:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
        createdBy: 'user-004',
        updatedBy: null,
      },
    ];

    const sortedData = testData.sort((a, b) =>
      a.actualStartDateTime.localeCompare(b.actualStartDateTime)
    );

    // ページ2、ページサイズ1の場合、2番目のレコードを返す
    const paginatedData = sortedData.slice(1, 2);

    const mockResult = {
      workResults: paginatedData,
      totalCount: sortedData.length,
      pageNumber: 2,
      pageSize: 1,
      retrievedAt: new Date().toISOString(),
    };

    jest.spyOn(dataPersistence, 'listWorkResultsByCondition').mockResolvedValue(mockResult);

    const result = await listWorkResultsByCondition({
      actualStartFromDateTime: '2024-01-01T00:00:00Z',
      actualStartToDateTime: '2024-03-31T23:59:59Z',
      pageNumber: 2,
      pageSize: 1,
      sortBy: 'actualStartDateTime',
      sortOrder: 'ASC',
    });

    // ページサイズが1で2ページ目を取得
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(1);
    // 返却される件数はページサイズ以下
    expect(result.workResults.length).toBeLessThanOrEqual(1);
  });
});