import { listProductivityDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-967: 検索条件に合致するレコードが0件の場合', () => {
  it('検索結果が0件のとき、空の一覧と総件数0を返す', async () => {
    // Arrange
    const searchCondition = {
      productivityDataIds: ['non-existent-id-001'],
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
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
    const result = await listProductivityDataByCondition(searchCondition);

    // Assert
    expect(result.productivityDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.pageNumber).toBeDefined();
    expect(result.pageSize).toBeDefined();
  });

  it('日付範囲の検証が正常に完了し、逆順エラーが発生しないこと', async () => {
    // Arrange
    const searchCondition = {
      productivityDataIds: ['non-existent-id-001'],
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-12-31T23:59:59Z',
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-12-31T23:59:59Z',
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act & Assert
    const result = await listProductivityDataByCondition(searchCondition);
    expect(result.productivityDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('ページネーション指定時もデフォルト値と区別して返却される', async () => {
    // Arrange
    const searchCondition = {
      productivityDataIds: ['non-existent-id-001'],
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 2,
      pageSize: 25,
    };

    // Act
    const result = await listProductivityDataByCondition(searchCondition);

    // Assert
    expect(result.productivityDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(25);
  });

  it('エラーが発生せず正常に完了する', async () => {
    // Arrange
    const searchCondition = {
      productivityDataIds: ['non-existent-id-001'],
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act & Assert
    await expect(listProductivityDataByCondition(searchCondition)).resolves.toBeDefined();
  });
});