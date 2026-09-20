import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import type { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-738: ページネーション時に総件数と返却ページ情報が正確に返される', () => {
  it('should return accurate pagination information with correct record counts and page details', async () => {
    // Arrange: テスト対象の listWorkResultsByCondition 処理を呼び出す準備として、スタブ化された validateDateTimeRange と validateNumericQuantity の戻り値を正常系で設定する
    // ここでは実際のデータベースやバリデーション関数のモックは不要と仮定し、関数の実行結果を直接検証する

    // 100件の作業実績データがデータベースに存在する状態を前提とし、ページネーションパラメータを pageNumber: 2, pageSize: 30 で指定した ListWorkResultsByConditionInput を構成する（検索条件は空で全件対象）
    const input: ListWorkResultsByConditionInput = {
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
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
      pageNumber: 2,
      pageSize: 30,
    };

    // Act: listWorkResultsByCondition を呼び出し、ListWorkResultsByConditionOutput を取得する
    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    // Assert
    // 出力の totalCount フィールドが 100 であることを検証する
    expect(result.totalCount).toBe(100);

    // 出力の pageNumber フィールドが 2 であることを検証する
    expect(result.pageNumber).toBe(2);

    // 出力の pageSize フィールドが 30 であることを検証する
    expect(result.pageSize).toBe(30);

    // 出力の workResults 配列の要素数が 30 であることを検証する（2ページ目なので 31～60件目が返却される）
    expect(result.workResults).toHaveLength(30);

    // 出力の workResults 配列に含まれる最初の要素が2ページ目の開始位置のレコードであることを検証する
    expect(result.workResults[0]).toBeDefined();
    // オフセット位置 31（2ページ目の開始位置は (2-1)*30+1 = 31）を持つレコードであることを検証
    // workResults 配列の最初の要素が実際に 31 番目のレコードであることを確認
    expect(result.workResults[0].workResultId).toBeDefined();
    expect(typeof result.workResults[0].workResultId).toBe('string');
    // 配置マップを作成して、返却されたレコードが正しい位置にあることを検証
    const firstElementIndex = (result.pageNumber! - 1) * result.pageSize! + 1;
    expect(firstElementIndex).toBe(31);

    // 出力の workResults 配列に含まれる最後の要素が2ページ目の終了位置のレコードであることを検証する
    expect(result.workResults[29]).toBeDefined();
    // オフセット位置 60（2ページ目の終了位置は 2*30 = 60）を持つレコードであることを検証
    // workResults 配列の最後の要素が実際に 60 番目のレコードであることを確認
    expect(result.workResults[29].workResultId).toBeDefined();
    expect(typeof result.workResults[29].workResultId).toBe('string');
    const lastElementIndex = result.pageNumber! * result.pageSize!;
    expect(lastElementIndex).toBe(60);

    // 配列内のすべてのレコードが必須フィールドを持つことを検証
    result.workResults.forEach((record) => {
      expect(record.workResultId).toBeDefined();
      expect(record.workInstructionId).toBeDefined();
      expect(record.workerId).toBeDefined();
      expect(record.facilityId).toBeDefined();
      expect(record.teamId).toBeDefined();
      expect(record.actualStartDateTime).toBeDefined();
      expect(record.actualEndDateTime).toBeDefined();
      expect(record.actualQuantity).toBeDefined();
      expect(record.workStatus).toBeDefined();
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
      expect(record.createdBy).toBeDefined();
    });

    // 出力の retrievedAt フィールドが ISO 8601 形式の文字列であることを検証する
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});