import { listFacilitiesByCondition } from '../../src/logic/data-persistence';
import { ListFacilitiesByConditionInput, ListFacilitiesByConditionOutput, GetFacilityByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-529: ページネーション指定時に指定ページのレコードのみを返す', () => {
  let testData: GetFacilityByIdOutput[];

  beforeEach(() => {
    // テスト初期化：総20件のGetFacilityByIdOutput形式のレコードを作成
    testData = Array.from({ length: 20 }, (_, index) => ({
      facilityId: `facility-${String(index + 1).padStart(2, '0')}`,
      facilityName: `拠点${String.fromCharCode(65 + (index % 26))}${Math.floor(index / 26) + 1}`,
      facilityCode: `CODE-${String(index + 1).padStart(3, '0')}`,
      address: `住所${index + 1}`,
      maxCapacity: 100 + index * 10,
      currentCapacity: 50 + index * 5,
      operatingStatus: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'inactive' : 'maintenance',
      responsiblePersonName: `責任者${index + 1}`,
      contactInfo: `090-${String(index + 1).padStart(4, '0')}-0000`,
      createdAt: new Date(2024, 0, 1 + index).toISOString(),
      updatedAt: new Date(2024, 0, 15 + index).toISOString(),
      createdBy: `user-${index + 1}`,
      updatedBy: index % 2 === 0 ? `user-${index}` : null,
    }));
  });

  it('pageNumber=2、pageSize=5を指定した場合、2ページ目の5件のみを返すこと', async () => {
    const input: ListFacilitiesByConditionInput = {
      pageNumber: 2,
      pageSize: 5,
      sortBy: 'facilityName',
      sortOrder: 'asc',
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    };

    const output: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // facilities配列に5件のレコードが含まれていることを確認
    expect(output.facilities).toHaveLength(5);

    // ソート後の6～10番目のレコードが返されていることを確認
    const sortedData = testData.sort((a, b) => a.facilityName.localeCompare(b.facilityName));
    const expectedFacilities = sortedData.slice(5, 10);

    output.facilities.forEach((facility, index) => {
      expect(facility.facilityId).toBe(expectedFacilities[index].facilityId);
      expect(facility.facilityName).toBe(expectedFacilities[index].facilityName);
      expect(facility.facilityCode).toBe(expectedFacilities[index].facilityCode);
      expect(facility.address).toBe(expectedFacilities[index].address);
      expect(facility.maxCapacity).toBe(expectedFacilities[index].maxCapacity);
      expect(facility.currentCapacity).toBe(expectedFacilities[index].currentCapacity);
      expect(facility.operatingStatus).toBe(expectedFacilities[index].operatingStatus);
      expect(facility.responsiblePersonName).toBe(expectedFacilities[index].responsiblePersonName);
      expect(facility.contactInfo).toBe(expectedFacilities[index].contactInfo);
    });

    // totalCount、pageNumber、pageSizeの検証
    expect(output.totalCount).toBe(20);
    expect(output.pageNumber).toBe(2);
    expect(output.pageSize).toBe(5);

    // retrievedAtがISO 8601形式であることを確認
    expect(output.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('ページネーション未指定時はnullを返すこと', async () => {
    const input: ListFacilitiesByConditionInput = {
      pageNumber: null,
      pageSize: null,
      sortBy: 'facilityName',
      sortOrder: 'asc',
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    };

    const output: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // ページネーション未指定時はpageNumberとpageSizeがnullであることを確認
    expect(output.pageNumber).toBeNull();
    expect(output.pageSize).toBeNull();
  });

  it('最後のページを指定した場合、残りのレコードのみを返すこと', async () => {
    const input: ListFacilitiesByConditionInput = {
      pageNumber: 4,
      pageSize: 5,
      sortBy: 'facilityName',
      sortOrder: 'asc',
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    };

    const output: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // 最後のページ（4ページ目）には残りの0件が含まれる（20件 ÷ 5 = 4ページで完全に収まる）
    expect(output.facilities).toHaveLength(0);
    expect(output.totalCount).toBe(20);
    expect(output.pageNumber).toBe(4);
    expect(output.pageSize).toBe(5);
  });

  it('sortBy="facilityName"、sortOrder="asc"でソートが正しく機能すること', async () => {
    const input: ListFacilitiesByConditionInput = {
      pageNumber: 1,
      pageSize: 20,
      sortBy: 'facilityName',
      sortOrder: 'asc',
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    };

    const output: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    // 拠点名が昇順でソートされていることを確認
    for (let i = 1; i < output.facilities.length; i++) {
      expect(output.facilities[i].facilityName).toBeGreaterThanOrEqual(output.facilities[i - 1].facilityName);
    }
  });

  it('retrievedAtに現在時刻がISO 8601形式で設定されていること', async () => {
    const beforeCall = new Date().toISOString();

    const input: ListFacilitiesByConditionInput = {
      pageNumber: 1,
      pageSize: 5,
      sortBy: 'facilityName',
      sortOrder: 'asc',
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
    };

    const output: ListFacilitiesByConditionOutput = await listFacilitiesByCondition(input);

    const afterCall = new Date().toISOString();

    // retrievedAtが呼び出し前後の時刻の間にあることを確認
    expect(output.retrievedAt).toBeGreaterThanOrEqual(beforeCall);
    expect(output.retrievedAt).toBeLessThanOrEqual(afterCall);
  });
});