import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-901: 検索条件を指定せず全進捗データを取得できる', () => {
  it('should retrieve all progress data when no search conditions are specified', async () => {
    // Arrange
    const input = {
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: null,
      progressDateTo: null,
      minCompletionRate: null,
      maxCompletionRate: null,
      minActualQuantity: null,
      maxActualQuantity: null,
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

    // Act
    const result = await listProgressDataByCondition(input);

    // Assert
    // (1) 出力型がListProgressDataByConditionOutputであることを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('progressDataList');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');

    // (2) progressDataListはGetProgressDataByIdOutput型の配列であることを確認
    expect(Array.isArray(result.progressDataList)).toBe(true);
    if (result.progressDataList.length > 0) {
      const sampleRecord = result.progressDataList[0];
      expect(sampleRecord).toHaveProperty('progressDataId');
      expect(sampleRecord).toHaveProperty('workInstructionId');
      expect(sampleRecord).toHaveProperty('facilityId');
      expect(sampleRecord).toHaveProperty('teamId');
      expect(sampleRecord).toHaveProperty('progressDate');
      expect(sampleRecord).toHaveProperty('plannedQuantity');
      expect(sampleRecord).toHaveProperty('actualQuantity');
      expect(sampleRecord).toHaveProperty('completionRate');
      expect(sampleRecord).toHaveProperty('delayFlag');
      expect(sampleRecord).toHaveProperty('createdAt');
      expect(sampleRecord).toHaveProperty('updatedAt');
      expect(sampleRecord).toHaveProperty('createdBy');
      expect(typeof sampleRecord.progressDataId).toBe('string');
      expect(typeof sampleRecord.workInstructionId).toBe('string');
      expect(typeof sampleRecord.facilityId).toBe('string');
      expect(typeof sampleRecord.teamId).toBe('string');
    }

    // (3) totalCountが0以上の整数であることを確認
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.totalCount)).toBe(true);

    // (4) pageNumberおよびpageSizeがnullまたはundefinedであることを確認
    expect(result.pageNumber === null || result.pageNumber === undefined).toBe(true);
    expect(result.pageSize === null || result.pageSize === undefined).toBe(true);

    // (5) retrievedAtがISO 8601形式であることを確認
    expect(typeof result.retrievedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoDateRegex.test(result.retrievedAt)).toBe(true);
    expect(new Date(result.retrievedAt).getTime()).toBeGreaterThan(0);

    // (6) エラーが発生しないことを確認（非同期処理が正常に完了）
    expect(result).toBeTruthy();
  });
});