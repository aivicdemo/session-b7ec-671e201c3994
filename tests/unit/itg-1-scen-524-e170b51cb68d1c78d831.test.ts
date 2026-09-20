import { jest } from '@jest/globals';
import {
  listFacilitiesByCondition,
  ListFacilitiesByConditionInput,
  ListFacilitiesByConditionOutput,
  GetFacilityByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-524: 拠点作成日時の範囲で検索して該当レコードを取得する', () => {
  let mockDatabase: GetFacilityByIdOutput[];

  beforeEach(() => {
    mockDatabase = [
      {
        facilityId: 'FAC001',
        facilityName: '東京DC',
        facilityCode: 'TK-001',
        address: '東京都渋谷区',
        maxCapacity: 100,
        currentCapacity: 45,
        operatingStatus: '稼働中',
        responsiblePersonName: '山田太郎',
        contactInfo: '03-1234-5678',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'admin-001',
        updatedBy: null,
      },
      {
        facilityId: 'FAC002',
        facilityName: '大阪DC',
        facilityCode: 'OS-002',
        address: '大阪府大阪市',
        maxCapacity: 150,
        currentCapacity: 78,
        operatingStatus: '稼働中',
        responsiblePersonName: '鈴木次郎',
        contactInfo: '06-9876-5432',
        createdAt: '2024-02-20T14:30:00Z',
        updatedAt: '2024-02-20T14:30:00Z',
        createdBy: 'admin-001',
        updatedBy: null,
      },
      {
        facilityId: 'FAC003',
        facilityName: '名古屋DC',
        facilityCode: 'NG-003',
        address: '愛知県名古屋市',
        maxCapacity: 80,
        currentCapacity: 32,
        operatingStatus: '休止中',
        responsiblePersonName: '佐藤三郎',
        contactInfo: '052-1111-2222',
        createdAt: '2024-03-10T09:00:00Z',
        updatedAt: '2024-03-10T09:00:00Z',
        createdBy: 'admin-001',
        updatedBy: null,
      },
      {
        facilityId: 'FAC004',
        facilityName: '福岡DC',
        facilityCode: 'FK-004',
        address: '福岡県福岡市',
        maxCapacity: 120,
        currentCapacity: 56,
        operatingStatus: '稼働中',
        responsiblePersonName: '伊藤四郎',
        contactInfo: '092-3333-4444',
        createdAt: '2023-12-01T16:45:00Z',
        updatedAt: '2023-12-01T16:45:00Z',
        createdBy: 'admin-001',
        updatedBy: null,
      },
    ];
  });

  it('作成日時の範囲条件を指定して、該当期間内の拠点レコードを取得すること', async () => {
    const input: ListFacilitiesByConditionInput = {
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-02-29T23:59:59Z',
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result).toBeDefined();
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.facilities.length).toBe(2);

    const facilityIds = result.facilities.map((f) => f.facilityId);
    expect(facilityIds).toContain('FAC001');
    expect(facilityIds).toContain('FAC002');
    expect(facilityIds).not.toContain('FAC003');
    expect(facilityIds).not.toContain('FAC004');

    const fac001 = result.facilities.find((f) => f.facilityId === 'FAC001');
    expect(fac001).toBeDefined();
    expect(fac001?.facilityName).toBe('東京DC');
    expect(fac001?.createdAt).toBe('2024-01-15T10:00:00Z');

    const fac002 = result.facilities.find((f) => f.facilityId === 'FAC002');
    expect(fac002).toBeDefined();
    expect(fac002?.facilityName).toBe('大阪DC');
    expect(fac002?.createdAt).toBe('2024-02-20T14:30:00Z');
  });

  it('totalCountフィールドが検索条件に合致した拠点の総件数を示すこと', async () => {
    const input: ListFacilitiesByConditionInput = {
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-02-29T23:59:59Z',
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result.totalCount).toBe(2);
  });

  it('ページネーション未指定時にpageNumberとpageSizeがnull/undefinedであること', async () => {
    const input: ListFacilitiesByConditionInput = {
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-02-29T23:59:59Z',
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('retrievedAtがISO 8601形式の有効なタイムスタンプであること', async () => {
    const input: ListFacilitiesByConditionInput = {
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-02-29T23:59:59Z',
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    expect(result.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate instanceof Date).toBe(true);
    expect(isNaN(retrievedAtDate.getTime())).toBe(false);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('指定範囲外の拠点が結果に含まれないこと', async () => {
    const input: ListFacilitiesByConditionInput = {
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-02-29T23:59:59Z',
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    const facilityIds = result.facilities.map((f) => f.facilityId);
    expect(facilityIds).not.toContain('FAC003');
    expect(facilityIds).not.toContain('FAC004');
  });

  it('各拠点レコードが完全な情報を保持していること', async () => {
    const input: ListFacilitiesByConditionInput = {
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-02-29T23:59:59Z',
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    result.facilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(facility.facilityCode).toBeDefined();
      expect(facility.address).toBeDefined();
      expect(facility.maxCapacity).toBeDefined();
      expect(facility.currentCapacity).toBeDefined();
      expect(facility.operatingStatus).toBeDefined();
      expect(facility.responsiblePersonName).toBeDefined();
      expect(facility.contactInfo).toBeDefined();
      expect(facility.createdAt).toBeDefined();
      expect(facility.updatedAt).toBeDefined();
      expect(facility.createdBy).toBeDefined();
    });
  });
});