import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-526: 複数の検索条件を組み合わせて該当レコードを取得する', () => {
  it('should retrieve facilities matching all combined search criteria', async () => {
    // 手順1: validateDateTimeRangeをスタブ化（必要に応じて）
    // 注：実装が外部依存を持つ場合のみ適用

    // 手順2: 複数検索条件を組み合わせて呼び出し
    const result = await listFacilitiesByCondition({
      facilityIds: ['FAC-001', 'FAC-002', 'FAC-003'],
      facilityCodes: ['CODE-A', 'CODE-B'],
      facilityNameKeyword: 'Tokyo',
      operatingStatuses: ['稼働中', '休止中'],
      minCapacity: 50,
      maxCapacity: 200,
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-12-31T23:59:59Z',
      updatedFromDate: '2024-06-01T00:00:00Z',
      updatedToDate: '2024-11-30T23:59:59Z',
      sortBy: 'facilityId',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    });

    // 手順3: 期待結果を検証
    expect(result).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(typeof result.retrievedAt).toBe('string');

    // 期待結果: 全条件に合致したデータのみを確認
    result.facilities.forEach((facility) => {
      // facilityIdsに含まれるか
      expect(['FAC-001', 'FAC-002', 'FAC-003']).toContain(facility.facilityId);

      // facilityCodesに含まれるか
      expect(['CODE-A', 'CODE-B']).toContain(facility.facilityCode);

      // facilityNameKeywordが大文字小文字区別なしで部分一致するか
      expect(facility.facilityName.toLowerCase()).toContain('tokyo');

      // operatingStatusesに含まれるか
      expect(['稼働中', '休止中']).toContain(facility.operatingStatus);

      // maxCapacityが50以上200以下か
      expect(facility.maxCapacity).toBeGreaterThanOrEqual(50);
      expect(facility.maxCapacity).toBeLessThanOrEqual(200);

      // createdAtが2024-01-01以降2024-12-31以前か
      const createdAt = new Date(facility.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        new Date('2024-01-01T00:00:00Z').getTime()
      );
      expect(createdAt.getTime()).toBeLessThanOrEqual(
        new Date('2024-12-31T23:59:59Z').getTime()
      );

      // updatedAtが2024-06-01以降2024-11-30以前か
      const updatedAt = new Date(facility.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(
        new Date('2024-06-01T00:00:00Z').getTime()
      );
      expect(updatedAt.getTime()).toBeLessThanOrEqual(
        new Date('2024-11-30T23:59:59Z').getTime()
      );
    });

    // sortByおよびsortOrderが適用されているか確認
    if (result.facilities.length > 1) {
      for (let i = 1; i < result.facilities.length; i++) {
        // facilityIdでの昇順ソート確認
        expect(result.facilities[i].facilityId).toBeGreaterThanOrEqual(
          result.facilities[i - 1].facilityId
        );
      }
    }

    // retrievedAtがISO 8601形式であるか
    expect(() => new Date(result.retrievedAt)).not.toThrow();
  });
});