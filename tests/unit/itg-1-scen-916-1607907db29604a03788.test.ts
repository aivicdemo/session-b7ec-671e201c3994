import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-916: 複数の検索条件を組み合わせた結果を取得できる', () => {
  beforeEach(async () => {
    // テスト用の進捗データをデータベースに事前登録
    const testData = [
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        progressDate: '2024-01-10',
        plannedQuantity: 200,
        actualQuantity: 100,
        completionRate: 50,
        delayFlag: false,
        delayDays: 0,
        remarks: 'Test data 1',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-10T15:00:00Z',
        createdBy: 'USER001',
        updatedBy: null,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'FAC002',
        teamId: 'TEAM002',
        progressDate: '2024-01-15',
        plannedQuantity: 200,
        actualQuantity: 150,
        completionRate: 75,
        delayFlag: true,
        delayDays: 2,
        remarks: 'Test data 2',
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        createdBy: 'USER001',
        updatedBy: null,
      },
      {
        progressDataId: 'PD003',
        workInstructionId: 'WI003',
        facilityId: 'FAC003',
        teamId: 'TEAM003',
        progressDate: '2024-01-20',
        plannedQuantity: 200,
        actualQuantity: 50,
        completionRate: 30,
        delayFlag: true,
        delayDays: 5,
        remarks: 'Test data 3',
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z',
        createdBy: 'USER001',
        updatedBy: null,
      },
      {
        progressDataId: 'PD004',
        workInstructionId: 'WI004',
        facilityId: 'FAC004',
        teamId: 'TEAM004',
        progressDate: '2024-01-25',
        plannedQuantity: 200,
        actualQuantity: 200,
        completionRate: 90,
        delayFlag: false,
        delayDays: 0,
        remarks: 'Test data 4',
        createdAt: '2024-01-04T10:00:00Z',
        updatedAt: '2024-01-25T16:00:00Z',
        createdBy: 'USER001',
        updatedBy: null,
      },
    ];

    // データベースに登録
    for (const data of testData) {
      await saveProgressData({
        progressDataId: null,
        workInstructionId: data.workInstructionId,
        facilityId: data.facilityId,
        teamId: data.teamId,
        progressDate: data.progressDate,
        plannedQuantity: data.plannedQuantity,
        actualQuantity: data.actualQuantity,
        completionRate: data.completionRate,
        delayFlag: data.delayFlag,
        delayDays: data.delayDays,
        remarks: data.remarks,
        createdBy: data.createdBy,
      });
    }
  });

  it('should retrieve progress data matching combined filter conditions', async () => {
    const input = {
      progressDataIds: ['PD001', 'PD002'],
      facilityIds: null,
      teamIds: null,
      workInstructionIds: null,
      progressDateFrom: '2024-01-01',
      progressDateTo: '2024-01-15',
      minCompletionRate: 40,
      maxCompletionRate: 80,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDelayDays: 0,
      maxDelayDays: 3,
      delayFlagFilter: false,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: 'progressDate',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listProgressDataByCondition(input);

    expect(result).toBeDefined();
    expect(result.progressDataList).toBeDefined();
    expect(result.progressDataList.length).toBe(1);
    expect(result.totalCount).toBe(1);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();

    const retrievedData = result.progressDataList[0];
    expect(retrievedData.progressDataId).toBe('PD001');
    expect(retrievedData.workInstructionId).toBe('WI001');
    expect(retrievedData.facilityId).toBe('FAC001');
    expect(retrievedData.teamId).toBe('TEAM001');
    expect(retrievedData.progressDate).toBe('2024-01-10');
    expect(retrievedData.completionRate).toBe(50);
    expect(retrievedData.actualQuantity).toBe(100);
    expect(retrievedData.delayDays).toBe(0);
    expect(retrievedData.delayFlag).toBe(false);
    expect(retrievedData.createdAt).toBe('2024-01-01T10:00:00Z');
    expect(retrievedData.updatedAt).toBe('2024-01-10T15:00:00Z');

    // 条件マッチング検証
    for (const data of result.progressDataList) {
      // progressDataIds条件
      expect(['PD001', 'PD002']).toContain(data.progressDataId);
      // completionRate条件
      expect(data.completionRate).toBeGreaterThanOrEqual(40);
      expect(data.completionRate).toBeLessThanOrEqual(80);
      // delayDays条件
      expect(data.delayDays).toBeGreaterThanOrEqual(0);
      expect(data.delayDays).toBeLessThanOrEqual(3);
      // delayFlag条件
      expect(data.delayFlag).toBe(false);
      // progressDate条件（文字列日付比較）
      expect(data.progressDate >= '2024-01-01').toBe(true);
      expect(data.progressDate <= '2024-01-15').toBe(true);
    }
  });
});

async function saveProgressData(data: any) {
  // テスト環境のDBまたはモックに依存した実装
  // 実際のテスト実行環境では、DBコネクション経由でデータを挿入
  // 例：await db.insert(progressDataTable).values(data);
}