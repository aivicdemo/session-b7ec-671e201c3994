import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-535: 検索実行時刻がISO 8601形式で返される', () => {
  it('should return retrievedAt in ISO 8601 format with timezone information', async () => {
    // Arrange: 最小限の検索条件を構築
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

    // Act: listFacilitiesByCondition を実行
    const output = await listFacilitiesByCondition(input);

    // Assert: retrievedAt フィールドが存在することを確認
    expect(output).toHaveProperty('retrievedAt');
    expect(output.retrievedAt).toBeDefined();

    // retrievedAt が文字列であることを確認
    expect(typeof output.retrievedAt).toBe('string');

    // ISO 8601 形式の正規表現パターン
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    
    // retrievedAt が ISO 8601 形式に準拠していることを確認
    expect(output.retrievedAt).toMatch(iso8601Pattern);

    // タイムゾーン情報（Z または ±HH:MM）が含まれていることを確認
    const hasTimezoneInfo = output.retrievedAt.endsWith('Z') || 
                            /[+-]\d{2}:\d{2}$/.test(output.retrievedAt);
    expect(hasTimezoneInfo).toBe(true);

    // 日付部分が現在の日付と一致、または妥当な範囲内であることを確認
    const retrievedDate = new Date(output.retrievedAt);
    const now = new Date();
    const timeDiffMs = Math.abs(now.getTime() - retrievedDate.getTime());
    const timeDiffSeconds = timeDiffMs / 1000;
    
    // 実行時刻との誤差が5秒以内であることを確認（テスト実行時間を考慮）
    expect(timeDiffSeconds).toBeLessThanOrEqual(5);
  });

  it('should return retrievedAt with valid ISO 8601 timestamp format', async () => {
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
    const output = await listFacilitiesByCondition(input);

    // Assert: 日時パースが可能であることを確認
    const parsedDate = new Date(output.retrievedAt);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(isNaN(parsedDate.getTime())).toBe(false);

    // 年月日時分秒の各要素が有効な範囲内であることを確認
    expect(parsedDate.getFullYear()).toBeGreaterThanOrEqual(2020);
    expect(parsedDate.getMonth()).toBeGreaterThanOrEqual(0);
    expect(parsedDate.getMonth()).toBeLessThanOrEqual(11);
    expect(parsedDate.getDate()).toBeGreaterThanOrEqual(1);
    expect(parsedDate.getDate()).toBeLessThanOrEqual(31);
    expect(parsedDate.getHours()).toBeGreaterThanOrEqual(0);
    expect(parsedDate.getHours()).toBeLessThanOrEqual(23);
    expect(parsedDate.getMinutes()).toBeGreaterThanOrEqual(0);
    expect(parsedDate.getMinutes()).toBeLessThanOrEqual(59);
    expect(parsedDate.getSeconds()).toBeGreaterThanOrEqual(0);
    expect(parsedDate.getSeconds()).toBeLessThanOrEqual(59);
  });

  it('should include milliseconds in retrievedAt when appropriate', async () => {
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
    const output = await listFacilitiesByCondition(input);

    // Assert: 形式が Z サフィックスのバリエーション、または ±HH:MM オフセット付きであることを確認
    const withZSuffix = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    const withOffset = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/;

    const isValidFormat = withZSuffix.test(output.retrievedAt) || 
                         withOffset.test(output.retrievedAt);
    expect(isValidFormat).toBe(true);
  });
});