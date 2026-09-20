import {
  listDelayRiskJudgmentByCondition,
  ListDelayRiskJudgmentByConditionInput,
  ListDelayRiskJudgmentByConditionOutput,
  GetDelayRiskJudgmentByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-991: 作業指示IDで検索結果を絞り込む', () => {
  it('should retrieve delay risk judgment results filtered by workInstructionIds', async () => {
    // Step 1: 入力型を構築
    const input: ListDelayRiskJudgmentByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002'],
      facilityIds: null,
      teamIds: null,
      riskLevels: null,
      actionStatuses: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Step 2: 関数を呼び出し
    const output: ListDelayRiskJudgmentByConditionOutput =
      await listDelayRiskJudgmentByCondition(input);

    // Step 3: 出力型から delayRiskJudgments フィールドを確認
    expect(output).toBeDefined();
    expect(output.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgments)).toBe(true);

    // Step 4: delayRiskJudgments 配列内の各要素が指定された workInstructionIds に属することを検証
    output.delayRiskJudgments.forEach(
      (riskJudgment: GetDelayRiskJudgmentByIdOutput) => {
        expect(input.workInstructionIds).toContain(
          riskJudgment.workInstructionId
        );
      }
    );

    // Step 5: totalCount が フィルタ済み結果の全件数と一致することを検証
    expect(output.totalCount).toBe(output.delayRiskJudgments.length);

    // Step 6: retrievedAt が ISO 8601 形式の有効な日時文字列であることを検証
    expect(output.retrievedAt).toBeDefined();
    const isoDateRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoDateRegex.test(output.retrievedAt)).toBe(true);
    expect(new Date(output.retrievedAt).getTime()).not.toBeNaN();
  });
});