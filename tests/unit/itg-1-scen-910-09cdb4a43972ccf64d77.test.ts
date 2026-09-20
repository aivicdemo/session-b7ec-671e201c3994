import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-910: 遅延フラグでフィルタした結果を取得できる', () => {
  it('delayFlagFilter=true で呼び出した場合、遅延フラグ=true のレコードのみが返却される', async () => {
    const input = {
      delayFlagFilter: true,
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
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listProgressDataByCondition(input);

    expect(result).toBeDefined();
    expect(result.progressDataList).toBeDefined();
    expect(Array.isArray(result.progressDataList)).toBe(true);

    // 返却されたすべてのレコードが遅延フラグ=true の条件に合致することを確認
    result.progressDataList.forEach((progressData) => {
      expect(progressData.delayFlag).toBe(true);
    });

    // totalCount がレコード数と一致することを確認
    expect(result.totalCount).toBe(result.progressDataList.length);

    // ページネーション情報が期待値と一致することを確認
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    // retrievedAt が ISO 8601形式の有効なタイムスタンプであることを確認
    expect(result.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('delayFlagFilter=true で呼び出した結果が空の場合、progressDataList は空配列で totalCount は 0 となる', async () => {
    const input = {
      delayFlagFilter: true,
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
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listProgressDataByCondition(input);

    expect(result.progressDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeDefined();
  });

  it('返却される各進捗データが GetProgressDataByIdOutput の必須フィールドを含む', async () => {
    const input = {
      delayFlagFilter: true,
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
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listProgressDataByCondition(input);

    if (result.progressDataList.length > 0) {
      result.progressDataList.forEach((progressData) => {
        expect(progressData.progressDataId).toBeDefined();
        expect(typeof progressData.progressDataId).toBe('string');

        expect(progressData.workInstructionId).toBeDefined();
        expect(typeof progressData.workInstructionId).toBe('string');

        expect(progressData.facilityId).toBeDefined();
        expect(typeof progressData.facilityId).toBe('string');

        expect(progressData.teamId).toBeDefined();
        expect(typeof progressData.teamId).toBe('string');

        expect(progressData.progressDate).toBeDefined();
        expect(typeof progressData.progressDate).toBe('string');

        expect(progressData.plannedQuantity).toBeDefined();
        expect(typeof progressData.plannedQuantity).toBe('number');
        expect(progressData.plannedQuantity).toBeGreaterThanOrEqual(0);

        expect(progressData.actualQuantity).toBeDefined();
        expect(typeof progressData.actualQuantity).toBe('number');
        expect(progressData.actualQuantity).toBeGreaterThanOrEqual(0);

        expect(progressData.completionRate).toBeDefined();
        expect(typeof progressData.completionRate).toBe('number');

        expect(progressData.delayFlag).toBeDefined();
        expect(typeof progressData.delayFlag).toBe('boolean');

        expect(progressData.createdAt).toBeDefined();
        expect(typeof progressData.createdAt).toBe('string');

        expect(progressData.updatedAt).toBeDefined();
        expect(typeof progressData.updatedAt).toBe('string');

        expect(progressData.createdBy).toBeDefined();
        expect(typeof progressData.createdBy).toBe('string');
      });
    }
  });
});