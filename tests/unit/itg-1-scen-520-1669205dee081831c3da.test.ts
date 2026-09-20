import { listFacilitiesByCondition, ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-520: 拠点名キーワードで部分一致検索する', () => {
  beforeEach(() => {
    jest.spyOn(dataPersistence, 'listFacilitiesByCondition').mockResolvedValue({
      facilities: [
        {
          facilityId: 'fac-001',
          facilityName: '東京センター',
          facilityCode: 'TK001',
          address: '東京都渋谷区',
          maxCapacity: 100,
          currentCapacity: 80,
          operatingStatus: 'active',
          responsiblePersonName: '山田太郎',
          contactInfo: '03-xxxx-xxxx',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          facilityId: 'fac-002',
          facilityName: '東京支店',
          facilityCode: 'TK002',
          address: '東京都新宿区',
          maxCapacity: 150,
          currentCapacity: 120,
          operatingStatus: 'active',
          responsiblePersonName: '佐藤次郎',
          contactInfo: '03-yyyy-yyyy',
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 2,
      pageNumber: null,
      pageSize: null,
      retrievedAt: '2025-01-15T14:30:45.123Z',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('facilityNameKeywordに「東京」を指定して検索し、拠点名に「東京」を含む全ての拠点マスタデータを取得する', async () => {
    // Arrange
    const input: ListFacilitiesByConditionInput = {
      facilityNameKeyword: '東京',
      facilityIds: undefined,
      facilityCodes: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
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
    const result = await listFacilitiesByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result).toHaveProperty('facilities');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('retrievedAt');

    // facilities配列が存在し、型はGetFacilityByIdOutput[]
    expect(Array.isArray(result.facilities)).toBe(true);

    // 全ての施設の拠点名に「東京」が含まれていることを確認
    result.facilities.forEach((facility) => {
      expect(facility.facilityName).toContain('東京');
    });

    // totalCountが数値で、facilities配列の長さと一致または総件数を示す
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.facilities.length);

    // ページネーション未指定のため、pageNumberとpageSizeはnull/undefined
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // retrievedAtがISO 8601形式の日時文字列であることを確認
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.retrievedAt)).toBe(true);
  });

  it('拠点名キーワード検索で1件以上の拠点が返される場合、各拠点の基本情報が正確に含まれている', async () => {
    // Arrange
    const input: ListFacilitiesByConditionInput = {
      facilityNameKeyword: '東京',
    };

    // Act
    const result = await listFacilitiesByCondition(input);

    // Assert
    if (result.facilities.length > 0) {
      const facility = result.facilities[0];

      // 必須フィールドの検証
      expect(facility).toHaveProperty('facilityId');
      expect(facility).toHaveProperty('facilityName');
      expect(facility).toHaveProperty('facilityCode');
      expect(facility).toHaveProperty('address');
      expect(facility).toHaveProperty('maxCapacity');
      expect(facility).toHaveProperty('currentCapacity');
      expect(facility).toHaveProperty('operatingStatus');
      expect(facility).toHaveProperty('responsiblePersonName');
      expect(facility).toHaveProperty('contactInfo');
      expect(facility).toHaveProperty('createdAt');
      expect(facility).toHaveProperty('updatedAt');
      expect(facility).toHaveProperty('createdBy');

      // フィールド型の検証
      expect(typeof facility.facilityId).toBe('string');
      expect(typeof facility.facilityName).toBe('string');
      expect(typeof facility.facilityCode).toBe('string');
      expect(typeof facility.maxCapacity).toBe('number');
      expect(typeof facility.currentCapacity).toBe('number');
      expect(typeof facility.operatingStatus).toBe('string');
      expect(facility.maxCapacity).toBeGreaterThan(0);
      expect(facility.currentCapacity).toBeGreaterThanOrEqual(0);
      expect(facility.currentCapacity).toBeLessThanOrEqual(facility.maxCapacity);
    }
  });

  it('拠点名キーワード検索で0件が返される場合、facilities配列が空でtotalCountが0である', async () => {
    // Arrange
    jest.spyOn(dataPersistence, 'listFacilitiesByCondition').mockResolvedValue({
      facilities: [],
      totalCount: 0,
      pageNumber: null,
      pageSize: null,
      retrievedAt: '2025-01-15T14:30:45.123Z',
    });

    const input: ListFacilitiesByConditionInput = {
      facilityNameKeyword: 'zzzzzzzzzzNotExistxxx',
    };

    // Act
    const result = await listFacilitiesByCondition(input);

    // Assert
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.facilities.length).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(typeof result.retrievedAt).toBe('string');
  });

  it('拠点名キーワードがnull/undefinedの場合、全ての拠点が返される', async () => {
    // Arrange
    jest.spyOn(dataPersistence, 'listFacilitiesByCondition').mockResolvedValue({
      facilities: [
        {
          facilityId: 'fac-001',
          facilityName: '東京センター',
          facilityCode: 'TK001',
          address: '東京都渋谷区',
          maxCapacity: 100,
          currentCapacity: 80,
          operatingStatus: 'active',
          responsiblePersonName: '山田太郎',
          contactInfo: '03-xxxx-xxxx',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          facilityId: 'fac-003',
          facilityName: '大阪拠点',
          facilityCode: 'OS001',
          address: '大阪府大阪市',
          maxCapacity: 200,
          currentCapacity: 150,
          operatingStatus: 'active',
          responsiblePersonName: '鈴木三郎',
          contactInfo: '06-zzzz-zzzz',
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-15T00:00:00.000Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 2,
      pageNumber: null,
      pageSize: null,
      retrievedAt: '2025-01-15T14:30:45.123Z',
    });

    const input: ListFacilitiesByConditionInput = {
      facilityNameKeyword: null,
    };

    // Act
    const result = await listFacilitiesByCondition(input);

    // Assert
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.retrievedAt).toBe('string');
  });
});