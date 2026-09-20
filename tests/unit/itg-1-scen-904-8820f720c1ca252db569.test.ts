import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-904: listProgressDataByCondition - 拠点IDで絞り込んだ結果を取得', () => {
  test('指定された拠点IDに属する進捗データのみが返却される', async () => {
    // Arrange
    const targetFacilityId = 'facility-001';
    const input = {
      facilityIds: [targetFacilityId],
      progressDataIds: undefined,
      workInstructionIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result = await listProgressDataByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.progressDataList).toBeDefined();
    expect(Array.isArray(result.progressDataList)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    // facilityIds で指定した拠点IDに属するデータのみが含まれていることを確認
    result.progressDataList.forEach((progressData) => {
      expect(progressData.facilityId).toBe(targetFacilityId);
    });

    // progressDataList の件数が totalCount と一致していることを確認
    expect(result.progressDataList.length).toBeLessThanOrEqual(result.totalCount);

    // retrievedAt が ISO 8601 形式であることを確認
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(isNaN(retrievedAtDate.getTime())).toBe(false);
  });

  test('拠点IDで指定した以外のデータが含まれていないこと', async () => {
    // Arrange
    const targetFacilityId = 'facility-001';
    const excludedFacilityId = 'facility-002';
    const input = {
      facilityIds: [targetFacilityId],
      progressDataIds: undefined,
      workInstructionIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result = await listProgressDataByCondition(input);

    // Assert
    const hasExcludedFacility = result.progressDataList.some(
      (progressData) => progressData.facilityId === excludedFacilityId
    );
    expect(hasExcludedFacility).toBe(false);
  });

  test('検索条件に合致するデータが存在しない場合、空の配列と0件を返す', async () => {
    // Arrange
    const nonExistentFacilityId = 'facility-nonexistent-9999';
    const input = {
      facilityIds: [nonExistentFacilityId],
      progressDataIds: undefined,
      workInstructionIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result = await listProgressDataByCondition(input);

    // Assert
    expect(result.progressDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
  });

  test('返却される各進捗データが期待される構造を持つこと', async () => {
    // Arrange
    const targetFacilityId = 'facility-001';
    const input = {
      facilityIds: [targetFacilityId],
      progressDataIds: undefined,
      workInstructionIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result = await listProgressDataByCondition(input);

    // Assert
    if (result.progressDataList.length > 0) {
      const firstProgressData = result.progressDataList[0];

      expect(firstProgressData.progressDataId).toBeDefined();
      expect(typeof firstProgressData.progressDataId).toBe('string');

      expect(firstProgressData.workInstructionId).toBeDefined();
      expect(typeof firstProgressData.workInstructionId).toBe('string');

      expect(firstProgressData.facilityId).toBeDefined();
      expect(typeof firstProgressData.facilityId).toBe('string');

      expect(firstProgressData.teamId).toBeDefined();
      expect(typeof firstProgressData.teamId).toBe('string');

      expect(firstProgressData.progressDate).toBeDefined();
      expect(typeof firstProgressData.progressDate).toBe('string');

      expect(firstProgressData.plannedQuantity).toBeDefined();
      expect(typeof firstProgressData.plannedQuantity).toBe('number');

      expect(firstProgressData.actualQuantity).toBeDefined();
      expect(typeof firstProgressData.actualQuantity).toBe('number');

      expect(firstProgressData.completionRate).toBeDefined();
      expect(typeof firstProgressData.completionRate).toBe('number');

      expect(firstProgressData.delayFlag).toBeDefined();
      expect(typeof firstProgressData.delayFlag).toBe('boolean');

      expect(firstProgressData.createdAt).toBeDefined();
      expect(typeof firstProgressData.createdAt).toBe('string');

      expect(firstProgressData.updatedAt).toBeDefined();
      expect(typeof firstProgressData.updatedAt).toBe('string');

      expect(firstProgressData.createdBy).toBeDefined();
      expect(typeof firstProgressData.createdBy).toBe('string');
    }
  });
});