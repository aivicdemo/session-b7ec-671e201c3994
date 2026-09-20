import { listWorkInstructionsByCondition, saveWorkInstruction } from '../../src/logic/data-persistence';

describe('SCEN-693: ページネーション指定時の作業指示一覧取得', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ページネーションが指定された場合は該当ページのデータと総件数が返却される', async () => {
    // テストデータ準備：10件の作業指示を作成して保存
    const priorityOrder = ['低', '中', '高'];
    const savedWorkInstructionIds: string[] = [];

    for (let i = 0; i < 10; i++) {
      const priority = priorityOrder[i % 3];
      const saveInput = {
        workInstructionId: null,
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionNumber: `WI-${String(i + 1).padStart(3, '0')}`,
        workName: `作業${i + 1}`,
        workDescription: `作業説明${i + 1}`,
        plannedStartDateTime: new Date(2024, 0, 1 + i).toISOString(),
        plannedEndDateTime: new Date(2024, 0, 2 + i).toISOString(),
        progressStatus: i < 2 ? '完了' : i < 5 ? '進行中' : '未開始',
        progressRate: i < 2 ? 100 : i < 5 ? 50 : 0,
        requiredWorkerCount: (i % 5) + 1,
        priority: priority,
        createdBy: 'user-001',
      };

      const saveResult = await saveWorkInstruction(saveInput);
      savedWorkInstructionIds.push(saveResult.workInstructionId);
    }

    // 関数を呼び出し
    const result = await listWorkInstructionsByCondition({
      pageNumber: 2,
      pageSize: 3,
      sortBy: 'priority',
      sortOrder: 'asc',
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionNumbers: null,
      workNameKeyword: null,
      progressStatuses: null,
      priorities: null,
      minRequiredWorkerCount: null,
      maxRequiredWorkerCount: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    });

    // 検証：出力型がListWorkInstructionsByConditionOutputであることを確認
    expect(result).toBeDefined();
    expect(result.workInstructions).toBeDefined();
    expect(Array.isArray(result.workInstructions)).toBe(true);

    // ページネーション検証
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(3);
    expect(result.totalCount).toBe(10);

    // ページ2のデータは3件であることを確認
    expect(result.workInstructions.length).toBe(3);

    // retrievedAtがISO 8601形式の現在時刻文字列であることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/
    );
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');

    // workInstructionsの各要素がGetWorkInstructionByIdOutput型であることを確認
    // 作業指示の詳細情報・進捗状況・割当人員を含む検証
    result.workInstructions.forEach((workInst) => {
      // 詳細情報
      expect(workInst).toHaveProperty('workInstructionId');
      expect(typeof workInst.workInstructionId).toBe('string');
      expect(workInst).toHaveProperty('facilityId');
      expect(workInst).toHaveProperty('teamId');
      expect(workInst).toHaveProperty('workInstructionNumber');
      expect(workInst).toHaveProperty('workName');
      expect(typeof workInst.workName).toBe('string');
      expect(workInst.workName.length).toBeGreaterThan(0);

      // 進捗状況
      expect(workInst).toHaveProperty('progressStatus');
      expect(['未開始', '進行中', '完了']).toContain(workInst.progressStatus);
      expect(workInst).toHaveProperty('progressRate');
      expect(typeof workInst.progressRate).toBe('number');
      expect(workInst.progressRate).toBeGreaterThanOrEqual(0);
      expect(workInst.progressRate).toBeLessThanOrEqual(100);

      // 割当人員
      expect(workInst).toHaveProperty('requiredWorkerCount');
      expect(typeof workInst.requiredWorkerCount).toBe('number');
      expect(workInst.requiredWorkerCount).toBeGreaterThanOrEqual(1);
      expect(workInst.requiredWorkerCount).toBeLessThanOrEqual(5);

      // 時刻情報
      expect(workInst).toHaveProperty('plannedStartDateTime');
      expect(workInst).toHaveProperty('plannedEndDateTime');
      expect(workInst).toHaveProperty('createdAt');
      expect(workInst).toHaveProperty('updatedAt');
      expect(workInst).toHaveProperty('createdBy');
    });

    // ページ2が2ページ目（ページ1は0-2番目、ページ2は3-5番目のインデックス）に相当することを確認
    expect(result.workInstructions.length).toBe(3);
    
    // ページ2のレコードが3～5番目のインデックス（4～6番目のレコード）の範囲に該当することを確認
    // ソート後の優先度の昇順では、低(0,3,6,9), 中(1,4,7), 高(2,5,8)
    // ページ1(インデックス0-2)：レコード1,2,3、ページ2(インデックス3-5)：レコード4,5,6
    const recordNumbers = result.workInstructions.map((wi) =>
      parseInt(wi.workInstructionNumber.replace('WI-', ''))
    );
    
    // ページ2に含まれるレコードのレコード番号が4以上6以下の範囲にあることを検証
    recordNumbers.forEach((recordNum) => {
      expect(recordNum).toBeGreaterThanOrEqual(4);
      expect(recordNum).toBeLessThanOrEqual(6);
    });
  });
});