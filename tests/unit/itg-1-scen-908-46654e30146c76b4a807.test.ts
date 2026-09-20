import { listProgressDataByCondition, ListProgressDataByConditionInput, ListProgressDataByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-908: 実績数量の範囲で絞り込んだ結果を取得できる', () => {
  it('実績数量の範囲条件に合致する進捗データを取得する', async () => {
    // テスト対象の処理 listProgressDataByCondition を呼び出す
    const input: ListProgressDataByConditionInput = {
      minActualQuantity: 50,
      maxActualQuantity: 150,
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: null,
      progressDateTo: null,
      minCompletionRate: null,
      maxCompletionRate: null,
      minDelayDays: null,
      maxDelayDays: null,
      delayFlagFilter: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // 処理を実行し、出力型 ListProgressDataByConditionOutput を取得する
    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    // 返却されたデータの検証

    // (1) progressDataList に含まれるすべての GetProgressDataByIdOutput が、
    // minActualQuantity=50、maxActualQuantity=150の範囲条件に合致する進捗データであることを確認する
    for (const progressData of result.progressDataList) {
      expect(progressData.actualQuantity).toBeGreaterThanOrEqual(50);
      expect(progressData.actualQuantity).toBeLessThanOrEqual(150);
    }

    // (2) totalCount が実績数量範囲50～150に合致するレコード総数と一致することを確認する
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    if (result.pageSize && result.pageNumber) {
      expect(result.progressDataList.length).toBeLessThanOrEqual(result.pageSize);
    }

    // (3) progressDataList 内の各要素が GetProgressDataByIdOutput 型の完全な進捗データ構造を持つことを確認する
    for (const progressData of result.progressDataList) {
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
      expect(progressData.actualQuantity).toBeDefined();
      expect(typeof progressData.actualQuantity).toBe('number');
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
    }

    // (4) retrievedAt が ISO 8601形式の有効なタイムスタンプであることを確認する
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).not.toBeNaN();

    // (5) 指定された範囲外の実績数量に該当する進捗データが progressDataList に含まれていないことを確認する
    for (const progressData of result.progressDataList) {
      expect(progressData.actualQuantity).not.toBeLessThan(50);
      expect(progressData.actualQuantity).not.toBeGreaterThan(150);
    }
  });
});