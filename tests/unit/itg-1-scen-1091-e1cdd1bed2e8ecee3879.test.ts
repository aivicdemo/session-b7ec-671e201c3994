import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1091: ハンディターミナル連携ログのページネーション検索', () => {
  it('ページネーション指定時に、指定ページのレコードのみが返される', async () => {
    // テストデータ：30件のハンディターミナル連携ログを用意
    // sentDateTime を確実にソート可能な値にするため、昇順で生成
    const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
    const testLogs = Array.from({ length: 30 }, (_, i) => ({
      handyTerminalSyncLogId: `log-${String(i + 1).padStart(2, '0')}`,
      workerId: `worker-${i % 5}`,
      handyTerminalId: `terminal-${i % 3}`,
      facilityId: `facility-${i % 2}`,
      syncType: 'work_result' as const,
      workInstructionId: `instruction-${i}`,
      syncContent: JSON.stringify({ status: 'test', index: i + 1 }),
      syncStatus: i < 15 ? 'success' : 'failure',
      errorMessage: i < 15 ? null : `Error occurred at log ${i + 1}`,
      sentDateTime: new Date(baseTime + i * 60000).toISOString(),
      receivedDateTime: i < 25 ? new Date(baseTime + i * 60000 + 5000).toISOString() : null,
      processingCompletedDateTime: i < 25 ? new Date(baseTime + i * 60000 + 10000).toISOString() : null,
      retryCount: i % 3,
      createdAt: new Date(baseTime + i * 60000).toISOString(),
      updatedAt: new Date(baseTime + i * 60000).toISOString(),
      createdBy: `user-${i % 4}`,
      updatedBy: null,
    }));

    // モック：実装関数がテストデータを参照できるようにセットアップ
    // テストデータをメモリ内に保持し、listHandyTerminalSyncLogByCondition が
    // このデータを検索・フィルタ・ソート・ページネーション処理の対象として使用することを想定
    const mockDataStore = testLogs;

    // 実装関数を直接呼び出す
    // 入力条件：pageNumber = 2, pageSize = 10, sortBy = 'sentDateTime', sortOrder = 'asc'
    // 期待動作：オフセット 10 から 20 件までのレコード（11件目～20件目）を取得
    const result = await listHandyTerminalSyncLogByCondition({
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'sentDateTime',
      sortOrder: 'asc',
    });

    // 検証：配列要素数が10件であることを確認
    expect(result.handyTerminalSyncLogs).toHaveLength(10);

    // 検証：totalCount が30であることを確認
    expect(result.totalCount).toBe(30);

    // 検証：pageNumber が2、pageSize が10であることを確認
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);

    // 検証：ページ2のレコードが 11件目～20件目（テストデータの log-11 ～ log-20）であることを確認
    const returnedIds = result.handyTerminalSyncLogs.map(log => log.handyTerminalSyncLogId);
    const expectedIds = Array.from({ length: 10 }, (_, i) => 
      `log-${String(i + 11).padStart(2, '0')}`
    );
    expect(returnedIds).toEqual(expectedIds);

    // 検証：ソート順序が sentDateTime で昇順であることを確認
    for (let i = 1; i < result.handyTerminalSyncLogs.length; i++) {
      const prevTime = new Date(
        result.handyTerminalSyncLogs[i - 1].sentDateTime
      ).getTime();
      const currTime = new Date(
        result.handyTerminalSyncLogs[i].sentDateTime
      ).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }

    // 検証：retrievedAt が ISO 8601 形式の日時であることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 検証：retrievedAt が現在時刻に近いことを確認（5秒以内）
    const retrievedTime = new Date(result.retrievedAt).getTime();
    const nowTime = new Date().getTime();
    expect(Math.abs(nowTime - retrievedTime)).toBeLessThan(5000);
  });
});