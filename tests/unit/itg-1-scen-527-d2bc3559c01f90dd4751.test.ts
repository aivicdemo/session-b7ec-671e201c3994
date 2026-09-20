import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-527: listFacilitiesByCondition - ソート機能', () => {
  it('sortBy=maxCapacity、sortOrder=ascで昇順ソートされた拠点一覧を返す', async () => {
    // Arrange: テスト用の拠点マスタデータを準備
    const facilityA = {
      facilityId: 'fac-001',
      facilityName: '拠点A',
      facilityCode: 'FAC_A',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '田中太郎',
      contactInfo: 'tanaka@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-001',
    };

    const facilityB = {
      facilityId: 'fac-002',
      facilityName: '拠点B',
      facilityCode: 'FAC_B',
      address: '大阪府北区',
      maxCapacity: 80,
      currentCapacity: 40,
      operatingStatus: 'active',
      responsiblePersonName: '鈴木花子',
      contactInfo: 'suzuki@example.com',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
      createdBy: 'user-002',
      updatedBy: 'user-002',
    };

    const facilityC = {
      facilityId: 'fac-003',
      facilityName: '拠点C',
      facilityCode: 'FAC_C',
      address: '名古屋市中区',
      maxCapacity: 120,
      currentCapacity: 60,
      operatingStatus: 'active',
      responsiblePersonName: '佐藤次郎',
      contactInfo: 'sato@example.com',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
      createdBy: 'user-003',
      updatedBy: 'user-003',
    };

    // 入力条件の設定
    const input = {
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
      sortBy: 'maxCapacity',
      sortOrder: 'asc',
      pageNumber: null,
      pageSize: null,
    };

    // Act: listFacilitiesByCondition を呼び出す
    // 注: この実装では、事前登録されたデータに対して検索を実行することを想定
    // テスト環境でのデータ準備は、実装の詳細に応じてモック化またはテストDB操作で行う
    const result = await listFacilitiesByCondition(input);

    // Assert: 結果の検証
    // maxCapacityで昇順ソートされていることを確認
    expect(result.facilities).toBeDefined();
    expect(result.facilities.length).toBeGreaterThan(0);

    // ソート順序の検証: facilities配列がmaxCapacityで昇順にソートされている
    for (let i = 1; i < result.facilities.length; i++) {
      expect(result.facilities[i].maxCapacity).toBeGreaterThanOrEqual(
        result.facilities[i - 1].maxCapacity,
      );
    }

    // 総件数の検証
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');

    // 取得日時がISO 8601形式の文字列であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    // ページネーション情報がnullであることを確認
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('sortBy=maxCapacity、sortOrder=descで降順ソートされた拠点一覧を返す', async () => {
    // Arrange
    const input = {
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
      sortBy: 'maxCapacity',
      sortOrder: 'desc',
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result = await listFacilitiesByCondition(input);

    // Assert: 降順ソートの確認
    expect(result.facilities).toBeDefined();
    for (let i = 1; i < result.facilities.length; i++) {
      expect(result.facilities[i].maxCapacity).toBeLessThanOrEqual(
        result.facilities[i - 1].maxCapacity,
      );
    }
  });

  it('ソート条件なしで全拠点を返す', async () => {
    // Arrange
    const input = {
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
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result = await listFacilitiesByCondition(input);

    // Assert
    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(result.retrievedAt).toBeDefined();
  });
});