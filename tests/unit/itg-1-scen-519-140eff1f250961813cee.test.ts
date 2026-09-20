import { listFacilitiesByCondition, ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-519: 拠点コードで検索して該当レコードを取得する', () => {
  it('facilityCodes=[\'FAC-001\', \'FAC-002\']を指定して検索し、該当レコードのみを取得できる', async () => {
    // Arrange
    const input: ListFacilitiesByConditionInput = {
      facilityCodes: ['FAC-001', 'FAC-002'],
      facilityIds: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
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
    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // Assert
    // facilitiesフィールドを検証
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);

    // 検索条件に合致するレコードのみが含まれていることを確認
    result.facilities.forEach((facility) => {
      expect(['FAC-001', 'FAC-002']).toContain(facility.facilityCode);
    });

    // totalCountフィールドを検証
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(result.facilities.length);

    // retrievedAtフィールドを検証（ISO 8601形式）
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);

    // ページネーション関連フィールドを検証（未指定なのでnull）
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // 各レコードの構造を検証
    result.facilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(typeof facility.facilityId).toBe('string');
      expect(facility.facilityCode).toBeDefined();
      expect(['FAC-001', 'FAC-002']).toContain(facility.facilityCode);
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.facilityName).toBe('string');
      expect(facility.address).toBeDefined();
      expect(facility.maxCapacity).toBeDefined();
      expect(typeof facility.maxCapacity).toBe('number');
      expect(facility.maxCapacity).toBeGreaterThan(0);
      expect(facility.currentCapacity).toBeDefined();
      expect(typeof facility.currentCapacity).toBe('number');
      expect(facility.currentCapacity).toBeGreaterThanOrEqual(0);
      expect(facility.currentCapacity).toBeLessThanOrEqual(facility.maxCapacity);
      expect(facility.operatingStatus).toBeDefined();
      expect(typeof facility.operatingStatus).toBe('string');
      expect(facility.responsiblePersonName).toBeDefined();
      expect(facility.contactInfo).toBeDefined();
      expect(facility.createdAt).toBeDefined();
      expect(facility.updatedAt).toBeDefined();
      expect(facility.createdBy).toBeDefined();
    });
  });
});