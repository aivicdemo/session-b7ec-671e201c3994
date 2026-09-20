import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-740: データ取得日時がISO 8601形式でretrievedAtに返される', () => {
  it('should return retrievedAt in ISO 8601 format within 5 seconds of test execution time', async () => {
    // Step 1: 入力オブジェクトを構築
    const testStartTime = new Date();

    const input = {
      workResultIds: ['WR001', 'WR002'],
      pageNumber: 1,
      pageSize: 10,
      facilityIds: undefined,
      teamIds: undefined,
      workerIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    // Step 2: listWorkResultsByConditionを実行
    const output = await listWorkResultsByCondition(input);

    const testEndTime = new Date();

    // Step 3: retrievedAtフィールドを取得
    const retrievedAt = output.retrievedAt;

    // Step 4: retrievedAtが文字列型であることを確認
    expect(typeof retrievedAt).toBe('string');

    // Step 5: retrievedAtがISO 8601形式に準拠していることを確認
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/;
    expect(iso8601Pattern.test(retrievedAt)).toBe(true);

    // Step 6: retrievedAtの値がテスト実行時刻の前後5秒以内であることを確認
    const retrievedAtDate = new Date(retrievedAt);
    const timeDifferenceMs = Math.abs(retrievedAtDate.getTime() - testStartTime.getTime());
    const fiveSecondsInMs = 5000;

    expect(timeDifferenceMs).toBeLessThanOrEqual(fiveSecondsInMs);
  });
});