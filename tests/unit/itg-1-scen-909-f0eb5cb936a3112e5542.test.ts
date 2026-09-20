import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-909: 遅延日数の範囲で絞り込んだ結果を取得できる', () => {
  test('minDelayDays=5、maxDelayDays=10で絞り込んだ進捗データを取得', async () => {
    // listProgressDataByConditionを呼び出す際、入力型ListProgressDataByConditionInputの以下のフィールドを設定
    const input = {
      progressDataIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: 5,
      maxDelayDays: 10,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listProgressDataByCondition(input);

    // 検証: 戻り値のprogressDataListに含まれるすべての進捗データの遅延日数が5日以上10日以下の範囲内であること
    expect(result.progressDataList).toBeDefined();
    expect(Array.isArray(result.progressDataList)).toBe(true);

    // すべての進捗データが遅延日数5～10の範囲内であることを確認
    result.progressDataList.forEach((progressData) => {
      if (progressData.delayDays !== null && progressData.delayDays !== undefined) {
        expect(progressData.delayDays).toBeGreaterThanOrEqual(5);
        expect(progressData.delayDays).toBeLessThanOrEqual(10);
      }
    });

    // 遅延日数が5日、7日、10日のデータのみが返却されていることを確認
    const delayDaysSet = new Set(
      result.progressDataList
        .map((pd) => pd.delayDays)
        .filter((dd) => dd !== null && dd !== undefined)
    );
    expect(delayDaysSet.size).toBeGreaterThan(0);
    delayDaysSet.forEach((delayDays) => {
      expect(delayDays).toBeGreaterThanOrEqual(5);
      expect(delayDays).toBeLessThanOrEqual(10);
    });

    // 0日、3日、15日のデータは除外されていることを確認
    const hasExcludedData = result.progressDataList.some(
      (pd) =>
        pd.delayDays === 0 ||
        pd.delayDays === 3 ||
        pd.delayDays === 15
    );
    expect(hasExcludedData).toBe(false);

    // totalCountは範囲内のデータ件数を示していること
    expect(result.totalCount).toBe(result.progressDataList.length);
    expect(result.totalCount).toBeGreaterThan(0);

    // retrievedAtにはデータ取得時刻がISO 8601形式で格納されていること
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const iso8601Regex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);
  });
});