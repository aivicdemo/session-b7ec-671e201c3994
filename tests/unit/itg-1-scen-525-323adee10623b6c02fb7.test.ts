import { listFacilitiesByCondition, ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-525: 拠点更新日時の範囲で検索して該当レコードを取得する', () => {
  const setupTestData = () => {
    const facilities = [
      {
        facilityId: 'F001',
        facilityName: '東京拠点',
        facilityCode: 'TK001',
        address: '東京都渋谷区',
        maxCapacity: 100,
        currentCapacity: 75,
        operatingStatus: 'active',
        responsiblePersonName: '田中太郎',
        contactInfo: '03-xxxx-xxxx',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-15T10:30:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        facilityId: 'F002',
        facilityName: '大阪拠点',
        facilityCode: 'OS001',
        address: '大阪府大阪市',
        maxCapacity: 80,
        currentCapacity: 60,
        operatingStatus: 'active',
        responsiblePersonName: '鈴木花子',
        contactInfo: '06-xxxx-xxxx',
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-03-20T14:45:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        facilityId: 'F003',
        facilityName: '名古屋拠点',
        facilityCode: 'NG001',
        address: '愛知県名古屋市',
        maxCapacity: 60,
        currentCapacity: 45,
        operatingStatus: 'inactive',
        responsiblePersonName: '佐藤次郎',
        contactInfo: '052-xxxx-xxxx',
        createdAt: '2023-12-01T00:00:00Z',
        updatedAt: '2023-12-25T09:00:00Z',
        createdBy: 'admin',
        updatedBy: null,
      },
      {
        facilityId: 'F004',
        facilityName: '福岡拠点',
        facilityCode: 'FK001',
        address: '福岡県福岡市',
        maxCapacity: 90,
        currentCapacity: 70,
        operatingStatus: 'active',
        responsiblePersonName: '高橋美咲',
        contactInfo: '092-xxxx-xxxx',
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2025-02-10T16:20:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    return facilities;
  };

  it('更新日時の範囲検索で条件に合致するレコードを取得する', async () => {
    const testData = setupTestData();

    const input: ListFacilitiesByConditionInput = {
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-12-31T23:59:59Z',
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result).toBeDefined();
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.facilities.length).toBe(2);

    const resultIds = result.facilities.map((f) => f.facilityId).sort();
    expect(resultIds).toEqual(['F001', 'F002']);

    result.facilities.forEach((facility) => {
      const updatedAt = new Date(facility.updatedAt).getTime();
      const fromDate = new Date(input.updatedFromDate!).getTime();
      const toDate = new Date(input.updatedToDate!).getTime();
      expect(updatedAt).toBeGreaterThanOrEqual(fromDate);
      expect(updatedAt).toBeLessThanOrEqual(toDate);
    });

    expect(result.totalCount).toBe(2);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('更新日時の範囲外のレコードは除外される', async () => {
    const testData = setupTestData();

    const input: ListFacilitiesByConditionInput = {
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-12-31T23:59:59Z',
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    const includesF003 = result.facilities.some((f) => f.facilityId === 'F003');
    const includesF004 = result.facilities.some((f) => f.facilityId === 'F004');

    expect(includesF003).toBe(false);
    expect(includesF004).toBe(false);
  });

  it('ページネーション指定がない場合、pageNumber と pageSize は null である', async () => {
    const testData = setupTestData();

    const input: ListFacilitiesByConditionInput = {
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-12-31T23:59:59Z',
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('retrievedAt は ISO 8601 形式の文字列である', async () => {
    const testData = setupTestData();

    const input: ListFacilitiesByConditionInput = {
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-12-31T23:59:59Z',
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('updatedFromDate と updatedToDate が境界値で正確に処理される', async () => {
    const testData = setupTestData();

    const input: ListFacilitiesByConditionInput = {
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-12-31T23:59:59Z',
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    result.facilities.forEach((facility) => {
      const updatedAtTime = new Date(facility.updatedAt).getTime();
      const fromDateTime = new Date(input.updatedFromDate!).getTime();
      const toDateTime = new Date(input.updatedToDate!).getTime();

      expect(updatedAtTime >= fromDateTime && updatedAtTime <= toDateTime).toBe(true);
    });

    expect(result.totalCount).toBe(2);
  });
});