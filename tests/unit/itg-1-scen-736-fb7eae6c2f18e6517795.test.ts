import { listWorkResultsByCondition, ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-736: ソート対象フィールドとソート順序を指定してDESC順でソートされたデータが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sortBy=actualStartDateTime、sortOrder=DESCで降順にソートされたデータが返される', async () => {
    // 入力パラメータを設定
    const input: ListWorkResultsByConditionInput = {
      workResultIds: undefined,
      workInstructionIds: ['wi-001', 'wi-002'],
      workerIds: undefined,
      facilityIds: ['fac-001'],
      teamIds: undefined,
      workStatuses: ['completed'],
      minActualQuantity: 50,
      maxActualQuantity: 200,
      minDefectCount: 0,
      maxDefectCount: 5,
      actualStartFromDateTime: '2024-01-15T00:00:00Z',
      actualStartToDateTime: '2024-01-15T23:59:59Z',
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'actualStartDateTime',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 10,
    };

    // 対象処理を呼び出す
    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    // 検証：出力型のフィールドが正常に返却されている
    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();

    // 検証：retrievedAt が ISO 8601 形式の現在日時
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate instanceof Date && !isNaN(retrievedDate.getTime())).toBe(true);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 検証：検索条件に合致するすべてのレコード数が totalCount に反映されている
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.workResults.length).toBeLessThanOrEqual(result.totalCount);

    // 検証：返却されたデータが検索条件に合致していること
    result.workResults.forEach((workResult) => {
      expect(['wi-001', 'wi-002']).toContain(workResult.workInstructionId);
      expect(['fac-001']).toContain(workResult.facilityId);
      expect(['completed']).toContain(workResult.workStatus);
      expect(workResult.actualQuantity).toBeGreaterThanOrEqual(50);
      expect(workResult.actualQuantity).toBeLessThanOrEqual(200);
    });

    // 検証：sortOrder=DESC で DESC 順にソートされている
    if (result.workResults.length > 1) {
      for (let i = 0; i < result.workResults.length - 1; i++) {
        const currentDateTime = new Date(result.workResults[i].actualStartDateTime).getTime();
        const nextDateTime = new Date(result.workResults[i + 1].actualStartDateTime).getTime();

        // DESC 順：i 番目の値が i+1 番目の値以上であることを確認
        expect(currentDateTime).toBeGreaterThanOrEqual(nextDateTime);
      }
    }

    // 検証：ソートの最初の要素が最も大きい actualStartDateTime を持つ
    if (result.workResults.length > 0) {
      const firstDateTime = new Date(result.workResults[0].actualStartDateTime).getTime();
      const lastDateTime = new Date(result.workResults[result.workResults.length - 1].actualStartDateTime).getTime();
      expect(firstDateTime).toBeGreaterThanOrEqual(lastDateTime);
    }
  });
});