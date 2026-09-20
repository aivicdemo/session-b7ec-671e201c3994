import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';
import type { ListDelayRiskJudgmentByConditionInput, ListDelayRiskJudgmentByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1019: 進捗率の最小値が0の場合に0%を含む結果を取得する', () => {
  it('minProgressRate = 0 を指定した検索で、進捗率が 0 のレコードを含める', async () => {
    // テスト対象関数の入力パラメータを構築
    const input: ListDelayRiskJudgmentByConditionInput = {
      minProgressRate: 0,
      maxProgressRate: 100,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minDelayPredictionDays: undefined,
      maxDelayPredictionDays: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // 関数を呼び出し
    const result: ListDelayRiskJudgmentByConditionOutput = await listDelayRiskJudgmentByCondition(input);

    // 検索条件に合致するレコードが返却されることを確認
    expect(result).toBeDefined();
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

    // totalCount が 0 以上の数値であることを確認
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // 返却されたレコード数と totalCount の整合性を確認
    // ページネーション未指定時は返却レコード数 = totalCount であるべき
    expect(result.delayRiskJudgments.length).toBe(result.totalCount);

    // retrievedAt が ISO 8601 形式の有効な日時文字列であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // minProgressRate = 0 の場合、進捗率が 0 のレコードが含まれていることを確認
    // 配列が空でないことを確認（仕様：delayRiskJudgments配列内に1件以上存在）
    expect(result.delayRiskJudgments.length).toBeGreaterThan(0);

    // 進捗率が 0 のレコードが存在することを確認
    const hasZeroProgressRate = result.delayRiskJudgments.some(
      record => record.progressRate !== undefined && record.progressRate === 0
    );
    expect(hasZeroProgressRate).toBe(true);

    // pageNumber と pageSize は入力で指定されていない場合は null または undefined
    expect([null, undefined]).toContain(result.pageNumber);
    expect([null, undefined]).toContain(result.pageSize);
  });

  it('minProgressRate = 0 で複数の進捗率を含むレコードが返却される場合、0% を含む境界条件処理を確認', async () => {
    const input: ListDelayRiskJudgmentByConditionInput = {
      minProgressRate: 0,
      maxProgressRate: 100,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minDelayPredictionDays: undefined,
      maxDelayPredictionDays: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListDelayRiskJudgmentByConditionOutput = await listDelayRiskJudgmentByCondition(input);

    // 結果が存在することを確認
    expect(result).toBeDefined();

    // 配列が空でないことを確認
    expect(result.delayRiskJudgments.length).toBeGreaterThan(0);

    // 返却されたレコードの進捗率が指定範囲内（0～100）であることを確認
    result.delayRiskJudgments.forEach(record => {
      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);
    });

    // ページネーション未指定時の総件数が取得件数と一致することを確認
    expect(result.delayRiskJudgments.length).toBe(result.totalCount);

    // 計画進捗率も 0～100 の範囲にあることを確認
    result.delayRiskJudgments.forEach(record => {
      expect(record.plannedProgressRate).toBeDefined();
      expect(typeof record.plannedProgressRate).toBe('number');
      expect(record.plannedProgressRate).toBeGreaterThanOrEqual(0);
      expect(record.plannedProgressRate).toBeLessThanOrEqual(100);
    });
  });

  it('リアルタイムデータと一致する retrievedAt を確認', async () => {
    const beforeCall = new Date();
    
    const input: ListDelayRiskJudgmentByConditionInput = {
      minProgressRate: 0,
      maxProgressRate: 100,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minDelayPredictionDays: undefined,
      maxDelayPredictionDays: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListDelayRiskJudgmentByConditionOutput = await listDelayRiskJudgmentByCondition(input);
    
    const afterCall = new Date();

    // 配列が空でないことを確認
    expect(result.delayRiskJudgments.length).toBeGreaterThan(0);

    // retrievedAt が呼び出し時点の現在日時（ISO 8601形式）に等しいことを確認
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });

  it('GetDelayRiskJudgmentByIdOutput オブジェクトの構造が正確であることを確認', async () => {
    const input: ListDelayRiskJudgmentByConditionInput = {
      minProgressRate: 0,
      maxProgressRate: 100,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minDelayPredictionDays: undefined,
      maxDelayPredictionDays: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListDelayRiskJudgmentByConditionOutput = await listDelayRiskJudgmentByCondition(input);

    // 配列が空でないことを確認
    expect(result.delayRiskJudgments.length).toBeGreaterThan(0);

    result.delayRiskJudgments.forEach(record => {
      // 必須フィールドの存在と型を確認
      expect(record.riskJudgmentId).toBeDefined();
      expect(typeof record.riskJudgmentId).toBe('string');

      expect(record.workInstructionId).toBeDefined();
      expect(typeof record.workInstructionId).toBe('string');

      expect(record.facilityId).toBeDefined();
      expect(typeof record.facilityId).toBe('string');

      expect(record.teamId).toBeDefined();
      expect(typeof record.teamId).toBe('string');

      expect(record.judgmentDateTime).toBeDefined();
      expect(typeof record.judgmentDateTime).toBe('string');

      expect(record.riskLevel).toBeDefined();
      expect(typeof record.riskLevel).toBe('string');

      expect(record.delayPredictionDays).toBeDefined();
      expect(typeof record.delayPredictionDays).toBe('number');

      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');

      expect(record.plannedProgressRate).toBeDefined();
      expect(typeof record.plannedProgressRate).toBe('number');

      expect(record.judgmentReason).toBeDefined();
      expect(typeof record.judgmentReason).toBe('string');

      expect(record.recommendedAction).toBeDefined();
      expect(typeof record.recommendedAction).toBe('string');

      expect(record.createdAt).toBeDefined();
      expect(typeof record.createdAt).toBe('string');

      expect(record.updatedAt).toBeDefined();
      expect(typeof record.updatedAt).toBe('string');

      expect(record.createdBy).toBeDefined();
      expect(typeof record.createdBy).toBe('string');
    });
  });

  it('progressRate = 0 の境界値を検証し、範囲内検索が正確に機能することを確認', async () => {
    const input: ListDelayRiskJudgmentByConditionInput = {
      minProgressRate: 0,
      maxProgressRate: 100,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minDelayPredictionDays: undefined,
      maxDelayPredictionDays: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListDelayRiskJudgmentByConditionOutput = await listDelayRiskJudgmentByCondition(input);

    // progressRate = 0 のレコードが存在することを確認
    const zeroProgressRecords = result.delayRiskJudgments.filter(record => record.progressRate === 0);
    expect(zeroProgressRecords.length).toBeGreaterThan(0);

    // すべてのレコードがフィルタ条件を満たすことを確認
    result.delayRiskJudgments.forEach(record => {
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);
    });
  });
});