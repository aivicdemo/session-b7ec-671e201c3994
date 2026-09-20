import { listFacilitiesByCondition, saveFacility } from '../../src/logic/data-persistence';
import type { ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput, SaveFacilityInput } from '../../src/logic/data-persistence';

describe('SCEN-521: 拠点名キーワード検索で大文字小文字を区別しない', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // テスト用のデータベースに以下のレコードを準備する
    // 拠点1: facilityNameが'Tokyo Warehouse'、operatingStatusが'稼働中'、maxCapacityが100
    // 拠点2: facilityNameが'TOKYO DISTRIBUTION'、operatingStatusが'稼働中'、maxCapacityが150
    // 拠点3: facilityNameが'Osaka Center'、operatingStatusが'稼働中'、maxCapacityが200
    // 拠点4: facilityNameが'tokyo logistics'、operatingStatusが'稼働中'、maxCapacityが120
    await Promise.all([
      saveFacility({
        facilityId: null,
        facilityName: 'Tokyo Warehouse',
        facilityCode: 'TW-001',
        address: '東京都',
        maxCapacity: 100,
        currentCapacity: 0,
        operatingStatus: '稼働中',
        responsiblePersonName: 'Manager A',
        contactInfo: 'contact-a@example.com',
        createdBy: 'test-user-1',
      }),
      saveFacility({
        facilityId: null,
        facilityName: 'TOKYO DISTRIBUTION',
        facilityCode: 'TD-001',
        address: '東京都',
        maxCapacity: 150,
        currentCapacity: 0,
        operatingStatus: '稼働中',
        responsiblePersonName: 'Manager B',
        contactInfo: 'contact-b@example.com',
        createdBy: 'test-user-1',
      }),
      saveFacility({
        facilityId: null,
        facilityName: 'Osaka Center',
        facilityCode: 'OC-001',
        address: '大阪府',
        maxCapacity: 200,
        currentCapacity: 0,
        operatingStatus: '稼働中',
        responsiblePersonName: 'Manager C',
        contactInfo: 'contact-c@example.com',
        createdBy: 'test-user-1',
      }),
      saveFacility({
        facilityId: null,
        facilityName: 'tokyo logistics',
        facilityCode: 'TL-001',
        address: '東京都',
        maxCapacity: 120,
        currentCapacity: 0,
        operatingStatus: '稼働中',
        responsiblePersonName: 'Manager D',
        contactInfo: 'contact-d@example.com',
        createdBy: 'test-user-1',
      }),
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('facilityNameKeywordに大文字を指定して、大文字小文字を区別せずに部分一致する拠点を全て取得する', async () => {
    // facilityNameKeywordに'TOKYO'（大文字）を指定して listFacilitiesByCondition を呼び出す
    const input: ListFacilitiesByConditionInput = {
      facilityNameKeyword: 'TOKYO',
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

    const result: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // 返却された ListFacilitiesByConditionOutput の facilities 配列を検証する
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);

    // facilities に、facilityNameが大文字小文字を区別せず'TOKYO'に部分一致する3件が全て含まれることを確認する
    const expectedFacilityNames = ['Tokyo Warehouse', 'TOKYO DISTRIBUTION', 'tokyo logistics'];
    const actualFacilityNames = result.facilities.map((f) => f.facilityName);

    expect(actualFacilityNames).toHaveLength(3);
    expectedFacilityNames.forEach((name) => {
      expect(actualFacilityNames).toContain(name);
    });

    // 拠点3（Osaka Center）は含まれないこと
    expect(actualFacilityNames).not.toContain('Osaka Center');

    // 返却された ListFacilitiesByConditionOutput の totalCount を検証する
    expect(result.totalCount).toBe(3);

    // retrievedAt は ISO 8601形式の文字列であること
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    // pageNumber と pageSize は null であること（ページネーション未指定時）
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });
});