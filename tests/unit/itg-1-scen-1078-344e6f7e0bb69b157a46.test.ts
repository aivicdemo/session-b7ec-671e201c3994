import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';
import { ListHandyTerminalSyncLogByConditionInput, ListHandyTerminalSyncLogByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1078: ハンディターミナル連携ログを検索条件で取得', () => {
  it('検索条件を指定してハンディターミナル連携ログを取得すると、合致するログレコードの配列、全件数、ページ情報、取得日時が返される', async () => {
    // Step 1: 入力型インスタンスを作成
    const input: ListHandyTerminalSyncLogByConditionInput = {
      syncStatuses: ['success'],
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'sentDateTime',
      sortOrder: 'desc',
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
    };

    // Step 2-3: 対象処理を呼び出す
    const output = await listHandyTerminalSyncLogByCondition(input);

    // Step 4: 出力型を受け取る
    expect(output).toBeDefined();

    // Step 5: handyTerminalSyncLogs フィールドが配列型であることを確認
    expect(Array.isArray(output.handyTerminalSyncLogs)).toBe(true);

    // Step 6: 配列内の各要素が GetHandyTerminalSyncLogByIdOutput 型であることを確認
    if (output.handyTerminalSyncLogs.length > 0) {
      const firstLog = output.handyTerminalSyncLogs[0];
      expect(firstLog).toHaveProperty('handyTerminalSyncLogId');
      expect(firstLog).toHaveProperty('workerId');
      expect(firstLog).toHaveProperty('handyTerminalId');
      expect(firstLog).toHaveProperty('facilityId');
      expect(firstLog).toHaveProperty('syncType');
      expect(firstLog).toHaveProperty('syncStatus');
      expect(firstLog).toHaveProperty('sentDateTime');
      expect(firstLog).toHaveProperty('createdAt');
      expect(firstLog).toHaveProperty('updatedAt');
      expect(typeof firstLog.handyTerminalSyncLogId).toBe('string');
      expect(typeof firstLog.workerId).toBe('string');
    }

    // Step 7: totalCount フィールドが数値型で0以上の整数値であることを確認
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(output.totalCount)).toBe(true);

    // Step 8: pageNumber フィールドが指定した値と一致することを確認
    expect(typeof output.pageNumber).toBe('number');
    expect(output.pageNumber).toBe(1);

    // Step 9: pageSize フィールドが指定した値と一致することを確認
    expect(typeof output.pageSize).toBe('number');
    expect(output.pageSize).toBe(10);

    // Step 10: retrievedAt フィールドがISO 8601形式の有効な日時を示す値であることを確認
    expect(typeof output.retrievedAt).toBe('string');
    const retrievedDate = new Date(output.retrievedAt);
    expect(retrievedDate instanceof Date && !isNaN(retrievedDate.getTime())).toBe(true);
    expect(output.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Step 11: 各ログレコードが検索条件に合致していることを確認
    output.handyTerminalSyncLogs.forEach((log) => {
      expect(['success']).toContain(log.syncStatus);
    });

    // Step 12: ログレコードが sortOrder 'desc' に従ってソートされていることを確認
    if (output.handyTerminalSyncLogs.length > 1) {
      for (let i = 0; i < output.handyTerminalSyncLogs.length - 1; i++) {
        const currentDate = new Date(output.handyTerminalSyncLogs[i].sentDateTime);
        const nextDate = new Date(output.handyTerminalSyncLogs[i + 1].sentDateTime);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    }

    // Step 13: retrievedAt の値が現在時刻に近い値であることを確認（誤差5秒以内）
    const testExecutionTime = new Date();
    const retrievedAtTime = new Date(output.retrievedAt);
    const timeDifferenceMs = Math.abs(
      testExecutionTime.getTime() - retrievedAtTime.getTime()
    );
    expect(timeDifferenceMs).toBeLessThanOrEqual(5000);

    // 期待結果の確認
    expect(output.handyTerminalSyncLogs.length).toBeLessThanOrEqual(10);
  });
});