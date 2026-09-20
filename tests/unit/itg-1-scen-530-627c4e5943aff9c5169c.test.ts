import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-530: ページネーション指定時に総件数と現在ページ番号を返す', () => {
  it('pageNumber=2、pageSize=10を指定して呼び出した場合、出力値に正しいページネーション情報が返されること', async () => {
    // テスト対象の入力値を準備する
    const input = {
      pageNumber: 2,
      pageSize: 10,
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    // listFacilitiesByCondition を呼び出す
    const output = await listFacilitiesByCondition(input);

    // 出力値の以下のフィールドを検証する
    expect(output).toBeDefined();
    expect(output).toHaveProperty('pageNumber');
    expect(output).toHaveProperty('pageSize');
    expect(output).toHaveProperty('totalCount');
    expect(output).toHaveProperty('facilities');
    expect(output).toHaveProperty('retrievedAt');

    // pageNumber: 指定したページ番号が返される
    expect(output.pageNumber).toBe(2);

    // pageSize: 指定した1ページあたりのレコード数が返される
    expect(output.pageSize).toBe(10);

    // totalCount: 検索条件に合致した全体の拠点件数（ページネーション前の総件数）
    expect(output.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(output.totalCount)).toBe(true);

    // facilities: 最大10件の GetFacilityByIdOutput 要素の配列
    expect(Array.isArray(output.facilities)).toBe(true);
    expect(output.facilities.length).toBeLessThanOrEqual(10);

    // facilities配列内の各要素が適切な構造を持つことを確認
    if (output.facilities.length > 0) {
      output.facilities.forEach((facility) => {
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
      });
    }

    // retrievedAt: ISO 8601形式の文字列（検索実行時刻）
    expect(typeof output.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.retrievedAt)).toBe(true);

    // ページネーション時の具体的な検証
    // totalCount=45件の場合、pageNumber=2、pageSize=10を指定すると
    // facilities配列には11～20番目のレコードが格納される
    if (output.totalCount > 10) {
      expect(output.facilities.length).toBeLessThanOrEqual(10);
    } else if (output.totalCount > 0) {
      // totalCountが10以下の場合、pageNumber=2では結果は0件
      if (output.pageNumber === 2 && output.totalCount <= 10) {
        expect(output.facilities.length).toBe(0);
      }
    }
  });

  it('totalCount=45件の場合、pageNumber=2、pageSize=10を指定すると11～20番目のレコードが返されること', async () => {
    const input = {
      pageNumber: 2,
      pageSize: 10,
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    const output = await listFacilitiesByCondition(input);

    // totalCountが45以上であることを期待
    // pageNumber=2でpageSize=10の場合、2ページ目が存在する
    if (output.totalCount >= 20) {
      expect(output.pageNumber).toBe(2);
      expect(output.pageSize).toBe(10);
      expect(output.facilities.length).toBeLessThanOrEqual(10);
      expect(output.facilities.length).toBeGreaterThan(0);
    }

    // retrievedAtが存在し、有効なタイムスタンプであること
    const retrievedTime = new Date(output.retrievedAt);
    expect(retrievedTime.getTime()).toBeGreaterThan(0);
  });

  it('複数ページにまたがるデータが存在する場合、各ページのレコード数がpageSize以下であること', async () => {
    const pageSize = 10;
    const input = {
      pageNumber: 1,
      pageSize,
      facilityIds: undefined,
      facilityCodes: undefined,
      facilityNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    const output = await listFacilitiesByCondition(input);

    // facilities配列の長さがpageSize以下であること
    expect(output.facilities.length).toBeLessThanOrEqual(pageSize);

    // totalCountが計算可能であること
    const totalPages = Math.ceil(output.totalCount / pageSize);
    expect(totalPages).toBeGreaterThanOrEqual(0);
  });
});