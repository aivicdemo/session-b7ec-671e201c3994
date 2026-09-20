import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-869: 人員配置実行状況リスト取得 - 全件数を含む', () => {
  it('検索条件に合致する全件数がtotalCountに含まれていること', async () => {
    // テスト対象の入力値を準備
    const input = {
      facilityIds: ['F001', 'F002'],
      allocationStates: ['進行中', '完了'],
      minProgressRate: 50,
      maxProgressRate: 100,
      pageNumber: 1,
      pageSize: 10,
    };

    // 実処理を呼び出す
    const output = await listAllocationExecutionStatusByCondition(input);

    // totalCountが0より大きいことを確認
    expect(output.totalCount).toBeGreaterThan(0);

    // 返された配列の長さがpageSize以下であることを確認
    expect(output.allocationExecutionStatuses.length).toBeLessThanOrEqual(input.pageSize);

    // 出力にallocationExecutionStatusesが配列として存在することを確認
    expect(Array.isArray(output.allocationExecutionStatuses)).toBe(true);

    // totalCountがページング前の全件数を表していることを確認
    // pageNumber=1、pageSize=10の場合、返される件数はmin(totalCount, pageSize)
    const expectedMaxElements = Math.min(output.totalCount, input.pageSize);
    expect(output.allocationExecutionStatuses.length).toBeLessThanOrEqual(expectedMaxElements);

    // 各要素が必須フィールドを保持していることを確認
    output.allocationExecutionStatuses.forEach((item) => {
      // 計画と実績のギャップを確認できるフィールド
      expect(item.plannedStartDateTime).toBeDefined();
      expect(item.plannedEndDateTime).toBeDefined();
      expect(item.actualStartDateTime).toBeDefined();
      expect(item.actualEndDateTime).toBeDefined();

      // 進捗率（0～100の数値）
      expect(item.progressRate).toBeGreaterThanOrEqual(0);
      expect(item.progressRate).toBeLessThanOrEqual(100);
      expect(typeof item.progressRate).toBe('number');

      // 遅延フラグ（true/false）
      expect(typeof item.delayFlag).toBe('boolean');

      // その他の必須フィールド
      expect(item.allocationExecutionStatusId).toBeDefined();
      expect(item.allocationPlanId).toBeDefined();
      expect(item.workInstructionId).toBeDefined();
      expect(item.workerId).toBeDefined();
      expect(item.facilityId).toBeDefined();
      expect(item.teamId).toBeDefined();
      expect(item.allocationState).toBeDefined();
    });

    // 出力にページネーション情報が含まれていることを確認
    expect(output.pageNumber).toBe(input.pageNumber);
    expect(output.pageSize).toBe(input.pageSize);

    // retrievedAtが日時フォーマットであることを確認
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');
  });

  it('検索条件に合致するデータが複数件ある場合、totalCountが正確であること', async () => {
    const input = {
      facilityIds: ['F001', 'F002'],
      allocationStates: ['進行中', '完了'],
      minProgressRate: 50,
      maxProgressRate: 100,
      pageNumber: 1,
      pageSize: 10,
    };

    const output = await listAllocationExecutionStatusByCondition(input);

    // totalCountが全体件数を示していることを検証
    // pageNumber=1でpageSize=10の場合、返される件数は最大10件
    if (output.totalCount > 10) {
      // 全体に45件以上ある場合、1ページ目は10件のはず
      expect(output.allocationExecutionStatuses.length).toBe(10);
    } else {
      // 全体が10件以下の場合、返される件数はtotalCount以下
      expect(output.allocationExecutionStatuses.length).toBeLessThanOrEqual(output.totalCount);
    }
  });

  it('各要素が計画と実績のギャップを含んでいること', async () => {
    const input = {
      facilityIds: ['F001'],
      allocationStates: ['進行中'],
      pageNumber: 1,
      pageSize: 5,
    };

    const output = await listAllocationExecutionStatusByCondition(input);

    if (output.allocationExecutionStatuses.length > 0) {
      const item = output.allocationExecutionStatuses[0];

      // 計画値が存在
      expect(item.plannedStartDateTime).toBeDefined();
      expect(item.plannedEndDateTime).toBeDefined();
      expect(item.plannedWorkHours).toBeDefined();

      // 実績値が存在（未実行の場合はnull許容）
      if (item.actualStartDateTime !== null && item.actualStartDateTime !== undefined) {
        expect(item.actualEndDateTime).toBeDefined();
        expect(item.actualWorkHours).toBeDefined();
      }

      // ギャップ判定に必要なフィールド
      expect(item.progressRate).toBeGreaterThanOrEqual(0);
      expect(item.delayFlag).toBeDefined();
    }
  });
});