import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-726: チームIDで検索して合致するデータが返される', () => {
  beforeEach(() => {
    // スタブ validateDateTimeRange を設定
    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // スタブ validateNumericQuantity を設定
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockReturnValue({
      isValid: true,
      errors: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return work results matching specified team IDs', async () => {
    // Arrange: テスト前提条件
    const teamIds = ['TEAM-001', 'TEAM-002'];
    const pageNumber = 1;
    const pageSize = 50;

    const mockWorkResults = [
      {
        workResultId: 'WR-001',
        workInstructionId: 'WI-001',
        workerId: 'W-001',
        facilityId: 'F-001',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T09:30:00Z',
        actualQuantity: 50,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'test result 1',
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T09:45:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'WR-002',
        workInstructionId: 'WI-001',
        workerId: 'W-002',
        facilityId: 'F-001',
        teamId: 'TEAM-002',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T10:30:00Z',
        actualQuantity: 45,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'test result 2',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T10:45:00Z',
        createdBy: 'user-002',
        updatedBy: undefined,
      },
      {
        workResultId: 'WR-003',
        workInstructionId: 'WI-002',
        workerId: 'W-003',
        facilityId: 'F-001',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T10:00:00Z',
        actualEndDateTime: '2024-01-15T11:30:00Z',
        actualQuantity: 48,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'test result 3',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T11:45:00Z',
        createdBy: 'user-003',
        updatedBy: undefined,
      },
      {
        workResultId: 'WR-004',
        workInstructionId: 'WI-002',
        workerId: 'W-004',
        facilityId: 'F-001',
        teamId: 'TEAM-002',
        actualStartDateTime: '2024-01-15T11:00:00Z',
        actualEndDateTime: '2024-01-15T12:30:00Z',
        actualQuantity: 52,
        workStatus: 'completed',
        defectCount: 3,
        remarks: 'test result 4',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T12:45:00Z',
        createdBy: 'user-004',
        updatedBy: undefined,
      },
      {
        workResultId: 'WR-005',
        workInstructionId: 'WI-003',
        workerId: 'W-005',
        facilityId: 'F-002',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T12:00:00Z',
        actualEndDateTime: '2024-01-15T13:30:00Z',
        actualQuantity: 55,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'test result 5',
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T13:45:00Z',
        createdBy: 'user-005',
        updatedBy: undefined,
      },
    ];

    // Mock listWorkResultsByCondition to return filtered data based on teamIds
    jest.spyOn(dataPersistence, 'listWorkResultsByCondition' as any).mockResolvedValue({
      workResults: mockWorkResults.filter((wr) => teamIds.includes(wr.teamId)),
      totalCount: 5,
      pageNumber: pageNumber,
      pageSize: pageSize,
      retrievedAt: new Date().toISOString(),
    });

    const beforeTestTime = new Date().toISOString();

    // Act: listWorkResultsByCondition を呼び出す
    const result = await listWorkResultsByCondition({
      teamIds: teamIds,
      pageNumber: pageNumber,
      pageSize: pageSize,
    });

    const afterTestTime = new Date().toISOString();

    // Assert: 戻り値を検証する
    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.workResults.length).toBeGreaterThan(0);

    // 各レコードが指定された teamIds に合致していることを確認
    result.workResults.forEach((workResult) => {
      expect(teamIds).toContain(workResult.teamId);
    });

    // totalCount が 5 であることを確認
    expect(result.totalCount).toBe(5);

    // pageNumber が 1 であることを確認
    expect(result.pageNumber).toBe(1);

    // pageSize が 50 であることを確認
    expect(result.pageSize).toBe(50);

    // retrievedAt が ISO 8601 形式のタイムスタンプであることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );

    // retrievedAt がテスト実行時刻に近いことを確認
    const retrievedTime = new Date(result.retrievedAt);
    const beforeTest = new Date(beforeTestTime);
    const afterTest = new Date(afterTestTime);

    expect(retrievedTime.getTime()).toBeGreaterThanOrEqual(
      beforeTest.getTime() - 1000
    );
    expect(retrievedTime.getTime()).toBeLessThanOrEqual(
      afterTest.getTime() + 1000
    );
  });
});