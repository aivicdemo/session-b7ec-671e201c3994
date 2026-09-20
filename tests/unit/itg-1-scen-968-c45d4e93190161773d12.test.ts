import { listProductivityDataByCondition } from '../../src/logic/data-persistence';
import type { ListProductivityDataByConditionInput, ListProductivityDataByConditionOutput, GetProductivityDataByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-968: 複数の検索条件を組み合わせて指定した場合、全条件に合致するレコードを取得する', () => {
  it('should return productivity data matching all combined search conditions', async () => {
    // テスト初期化：複数の検索条件を組み合わせた入力パラメータを準備
    const input: ListProductivityDataByConditionInput = {
      workerIds: ['W001', 'W002'],
      facilityIds: ['F001'],
      workDateFrom: '2024-01-01',
      workDateTo: '2024-01-31',
      minProductivityRate: 70,
      maxProductivityRate: 100,
      minQualityScore: 80,
      maxQualityScore: 100,
      proficiencyLevels: ['Level3', 'Level4'],
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'productivityRate',
      sortOrder: 'DESC',
    };

    // ListProductivityDataByConditionを呼び出す
    const result: ListProductivityDataByConditionOutput = await listProductivityDataByCondition(input);

    // 出力型ListProductivityDataByConditionOutputのproductivityDataListフィールドを検査
    expect(result.productivityDataList).toBeDefined();
    expect(Array.isArray(result.productivityDataList)).toBe(true);
    expect(result.productivityDataList.length).toBe(3);

    // 出力型のtotalCountフィールドを検査
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBe(3);

    // 出力型のpageNumberとpageSizeフィールドを検査
    expect(result.pageNumber).toBeDefined();
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBeDefined();
    expect(result.pageSize).toBe(10);

    // 出力型のretrievedAtフィールドがISO 8601形式の有効な日時であることを検査
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');

    // 返却されたproductivityDataListの各レコードが全検索条件に合致していることを確認
    result.productivityDataList.forEach((record: GetProductivityDataByIdOutput) => {
      // workerIds配列に含まれるIDを持つこと
      expect(input.workerIds).toContain(record.workerId);

      // facilityIds配列に含まれるIDを持つこと
      expect(input.facilityIds).toContain(record.facilityId);

      // 作業日がworkDateFromとworkDateToの範囲内であること
      const workDate = new Date(record.workDate);
      const fromDate = new Date(input.workDateFrom!);
      const toDate = new Date(input.workDateTo!);
      expect(workDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(workDate.getTime()).toBeLessThanOrEqual(toDate.getTime());

      // 生産性指標がminProductivityRateからmaxProductivityRateの範囲内であること
      expect(record.productivityRate).toBeDefined();
      expect(record.productivityRate).toBeGreaterThanOrEqual(input.minProductivityRate!);
      expect(record.productivityRate).toBeLessThanOrEqual(input.maxProductivityRate!);

      // 品質スコアがminQualityScoreからmaxQualityScoreの範囲内であること
      expect(record.qualityScore).toBeDefined();
      expect(record.qualityScore).toBeGreaterThanOrEqual(input.minQualityScore!);
      expect(record.qualityScore).toBeLessThanOrEqual(input.maxQualityScore!);

      // 習熟度レベルがproficiencyLevels配列に含まれること
      expect(input.proficiencyLevels).toContain(record.proficiencyLevel);
    });
  });
});