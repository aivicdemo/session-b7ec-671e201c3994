import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-996: 遅延予測日数の範囲で検索結果を絞り込む', () => {
  it('minDelayPredictionDaysとmaxDelayPredictionDaysの範囲内に合致するデータのみを返却する', async () => {
    const minDelayPredictionDays = 8;
    const maxDelayPredictionDays = 18;

    const result = await listDelayRiskJudgmentByCondition({
      minDelayPredictionDays,
      maxDelayPredictionDays,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 100,
    });

    expect(result).toBeDefined();
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

    result.delayRiskJudgments.forEach((judgment) => {
      expect(judgment.delayPredictionDays).toBeGreaterThanOrEqual(minDelayPredictionDays);
      expect(judgment.delayPredictionDays).toBeLessThanOrEqual(maxDelayPredictionDays);
    });

    expect(result.totalCount).toBe(result.delayRiskJudgments.length);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(100);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('範囲外のデータは検索結果から除外される', async () => {
    const minDelayPredictionDays = 8;
    const maxDelayPredictionDays = 18;

    const result = await listDelayRiskJudgmentByCondition({
      minDelayPredictionDays,
      maxDelayPredictionDays,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 100,
    });

    const outOfRangeData = result.delayRiskJudgments.filter(
      (judgment) =>
        judgment.delayPredictionDays < minDelayPredictionDays ||
        judgment.delayPredictionDays > maxDelayPredictionDays
    );

    expect(outOfRangeData).toHaveLength(0);
  });

  it('出力フィールドのフォーマットが正しいこと', async () => {
    const result = await listDelayRiskJudgmentByCondition({
      minDelayPredictionDays: 8,
      maxDelayPredictionDays: 18,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 100,
    });

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.pageNumber).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(typeof result.pageSize).toBe('number');
    expect(result.pageSize).toBe(100);
    expect(typeof result.retrievedAt).toBe('string');
  });
});