import { listProgressDataByCondition, ListProgressDataByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-915: ページネーション指定で指定ページの結果を取得できる', () => {
  it('pageNumber=2, pageSize=10でページ2の結果を取得する', async () => {
    // Setup: 100件の進捗データをデータベースに準備
    // ページ2では、11件目から20件目のデータが返されることを期待
    const mockProgressData = Array.from({ length: 100 }, (_, i) => ({
      progressDataId: `progress-${String(i + 1).padStart(3, '0')}`,
      workInstructionId: `work-inst-${Math.floor(i / 10) + 1}`,
      facilityId: `facility-${Math.floor(i / 25) + 1}`,
      teamId: `team-${Math.floor(i / 50) + 1}`,
      progressDate: new Date(2024, 0, 1 + Math.floor(i / 10)).toISOString(),
      plannedQuantity: 100 + i,
      actualQuantity: 90 + i,
      completionRate: 80 + (i % 20),
      delayFlag: i % 3 === 0,
      delayDays: i % 3 === 0 ? Math.floor(i / 10) : null,
      remarks: `Progress remark ${i + 1}`,
      createdAt: new Date(2024, 0, 1).toISOString(),
      updatedAt: new Date(2024, 0, 1).toISOString(),
      createdBy: `user-${Math.floor(i / 50) + 1}`,
      updatedBy: null,
    }));

    // ページ2（pageNumber=2, pageSize=10）を要求した場合、
    // 総100件のデータから11件目から20件目の10件を返すようモック設定
    const pageNumber = 2;
    const pageSize = 10;
    const startIndex = (pageNumber - 1) * pageSize; // 10
    const endIndex = startIndex + pageSize; // 20
    const pageData = mockProgressData.slice(startIndex, endIndex);

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        progressDataList: pageData,
        totalCount: 100,
        pageNumber: pageNumber,
        pageSize: pageSize,
        retrievedAt: new Date().toISOString(),
      }),
    } as Response);

    // Input: ページネーション条件を指定
    const input: ListProgressDataByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: null,
      maxCompletionRate: null,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDelayDays: null,
      maxDelayDays: null,
      delayFlagFilter: undefined,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
    };

    // Execute: listProgressDataByConditionを呼び出し
    const result = await listProgressDataByCondition(input);

    // Verify: 出力型ListProgressDataByConditionOutputの検証

    // (1) progressDataListが11件目から20件目の10件のGetProgressDataByIdOutputの配列であること
    expect(result.progressDataList).toHaveLength(10);
    // 11件目のデータ: progress-011（配列インデックス10のデータ）
    expect(result.progressDataList[0].progressDataId).toBe('progress-011');
    // 20件目のデータ: progress-020（配列インデックス19のデータ）
    expect(result.progressDataList[9].progressDataId).toBe('progress-020');

    // (2) totalCountフィールドが100であること
    expect(result.totalCount).toBe(100);

    // (3) pageNumberフィールドが2であること
    expect(result.pageNumber).toBe(2);

    // (4) pageSizeフィールドが10であること
    expect(result.pageSize).toBe(10);

    // (5) retrievedAtフィールドがISO 8601形式の有効な日時文字列であること
    expect(result.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});