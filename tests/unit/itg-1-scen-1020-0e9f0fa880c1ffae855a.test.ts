import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';
import { ListDelayRiskJudgmentByConditionInput, ListDelayRiskJudgmentByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1020: 進捗遅延リスク判定結果の一覧取得 - 進捗率100%を含む結果取得', () => {
  it('maxProgressRate: 100 の条件で、100%の進捗率を持つレコードを含む結果を取得する', async () => {
    // Arrange
    const input: ListDelayRiskJudgmentByConditionInput = {
      maxProgressRate: 100,
      riskJudgmentIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      riskLevels: null,
      actionStatuses: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
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

    // Act
    const output: ListDelayRiskJudgmentByConditionOutput = await listDelayRiskJudgmentByCondition(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgments)).toBe(true);
    expect(output.totalCount).toBeDefined();
    expect(typeof output.totalCount).toBe('number');
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');

    // ISO 8601 形式の日時文字列であることを検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(dateRegex.test(output.retrievedAt)).toBe(true);

    if (output.delayRiskJudgments.length > 0) {
      // すべてのレコードが maxProgressRate 100 以下の進捗率を持つことを確認
      output.delayRiskJudgments.forEach((record) => {
        expect(record.progressRate).toBeDefined();
        expect(typeof record.progressRate).toBe('number');
        expect(record.progressRate).toBeLessThanOrEqual(100);
      });

      // 100 に等しい進捗率を持つレコードが1件以上存在することを確認
      const hasMaxProgress = output.delayRiskJudgments.some(
        (record) => record.progressRate === 100,
      );
      expect(hasMaxProgress).toBe(true);

      // 各レコードの必須フィールドが設定されていることを確認
      output.delayRiskJudgments.forEach((record) => {
        expect(record.riskJudgmentId).toBeDefined();
        expect(record.workInstructionId).toBeDefined();
        expect(record.facilityId).toBeDefined();
        expect(record.teamId).toBeDefined();
        expect(record.judgmentDateTime).toBeDefined();
        expect(record.riskLevel).toBeDefined();
        expect(record.delayPredictionDays).toBeDefined();
        expect(record.plannedProgressRate).toBeDefined();
        expect(record.judgmentReason).toBeDefined();
        expect(record.recommendedAction).toBeDefined();
        expect(record.createdAt).toBeDefined();
        expect(record.updatedAt).toBeDefined();
        expect(record.createdBy).toBeDefined();
      });
    }
  });
});