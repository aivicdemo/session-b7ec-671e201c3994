import { listWorkResultsByCondition, ListWorkResultsByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-731: 作業終了日時の範囲で検索して合致するデータが返される', () => {
  beforeAll(async () => {
    // テスト用の作業実績データセットをデータベースに事前準備
    const testDataSet = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T10:00:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-01-15T10:05:00Z',
        updatedAt: '2024-01-15T10:05:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-20T12:30:00Z',
        actualEndDateTime: '2024-01-20T14:30:00Z',
        actualQuantity: 150,
        workStatus: 'completed',
        defectCount: 1,
        remarks: 'Minor defect found',
        createdAt: '2024-01-20T14:35:00Z',
        updatedAt: '2024-01-20T14:35:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-001',
        facilityId: 'facility-002',
        teamId: 'team-002',
        actualStartDateTime: '2024-02-05T07:15:00Z',
        actualEndDateTime: '2024-02-05T09:15:00Z',
        actualQuantity: 120,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-02-05T09:20:00Z',
        updatedAt: '2024-02-05T09:20:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        workResultId: 'wr-004',
        workInstructionId: 'wi-004',
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-03-10T15:00:00Z',
        actualEndDateTime: '2024-03-10T16:45:00Z',
        actualQuantity: 180,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'Quality check required',
        createdAt: '2024-03-10T16:50:00Z',
        updatedAt: '2024-03-10T16:50:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
      {
        workResultId: 'wr-005',
        workInstructionId: 'wi-005',
        workerId: 'worker-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        actualStartDateTime: '2023-12-25T10:00:00Z',
        actualEndDateTime: '2023-12-25T11:20:00Z',
        actualQuantity: 90,
        workStatus: 'completed',
        defectCount: 0,
        remarks: null,
        createdAt: '2023-12-25T11:25:00Z',
        updatedAt: '2023-12-25T11:25:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
    ];

    // Note: In a real test, you would insert these into a test database.
    // For this example, we assume the function queries an actual database
    // or we would mock the database layer.
  });

  it('should return 3 work results matching the actualEndDateTime range', async () => {
    const input: ListWorkResultsByConditionInput = {
      actualEndFromDateTime: '2024-01-01T00:00:00Z',
      actualEndToDateTime: '2024-02-28T23:59:59Z',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    // 戻り値の workResults 配列の長さを検証する
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.workResults.length).toBe(3);

    // 戻り値の workResults 配列に含まれる各レコードの actualEndFromDateTime を検証する
    const expectedEndDateTimes = [
      '2024-01-15T10:00:00Z',
      '2024-01-20T14:30:00Z',
      '2024-02-05T09:15:00Z',
    ];

    result.workResults.forEach((record, index) => {
      expect(record.actualEndDateTime).toBeDefined();
      const recordDateTime = new Date(record.actualEndDateTime).getTime();
      const expectedDateTime = new Date(expectedEndDateTimes[index]).getTime();
      const fromRange = new Date(input.actualEndFromDateTime!).getTime();
      const toRange = new Date(input.actualEndToDateTime!).getTime();

      expect(recordDateTime).toBeGreaterThanOrEqual(fromRange);
      expect(recordDateTime).toBeLessThanOrEqual(toRange);
    });

    // 戻り値の totalCount フィールドを検証する
    expect(result.totalCount).toBeDefined();
    expect(result.totalCount).toBe(3);

    // 戻り値の pageNumber フィールドを検証する
    expect(result.pageNumber).toBe(1);

    // 戻り値の pageSize フィールドを検証する
    expect(result.pageSize).toBe(50);

    // 戻り値の retrievedAt フィールドが ISO 8601 形式であることを検証する
    expect(result.retrievedAt).toBeDefined();
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);

    // ISO 8601 形式の日付がパースできることを確認
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate).not.toEqual(new Date('Invalid Date'));
  });
});