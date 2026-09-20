import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-990: リスク判定IDで検索結果を絞り込む', () => {
  it('指定されたリスク判定IDで検索結果を絞り込み、合致するデータを返却する', async () => {
    const input = {
      riskJudgmentIds: ['RISK-001', 'RISK-002', 'RISK-003'],
    };

    const result = await listDelayRiskJudgmentByCondition(input);

    expect(result).toBeDefined();
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

    result.delayRiskJudgments.forEach((judgment) => {
      expect(input.riskJudgmentIds).toContain(judgment.riskJudgmentId);
    });

    expect(result.delayRiskJudgments.length).toBeLessThanOrEqual(3);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.delayRiskJudgments.length);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    result.delayRiskJudgments.forEach((judgment) => {
      expect(judgment.riskJudgmentId).toBeDefined();
      expect(judgment.workInstructionId).toBeDefined();
      expect(judgment.facilityId).toBeDefined();
      expect(judgment.teamId).toBeDefined();
      expect(judgment.judgmentDateTime).toBeDefined();
      expect(judgment.riskLevel).toBeDefined();
      expect(judgment.delayPredictionDays).toBeDefined();
      expect(typeof judgment.delayPredictionDays).toBe('number');
      expect(judgment.progressRate).toBeDefined();
      expect(typeof judgment.progressRate).toBe('number');
      expect(judgment.plannedProgressRate).toBeDefined();
      expect(typeof judgment.plannedProgressRate).toBe('number');
      expect(judgment.judgmentReason).toBeDefined();
      expect(judgment.recommendedAction).toBeDefined();
      expect(judgment.createdAt).toBeDefined();
      expect(judgment.updatedAt).toBeDefined();
      expect(judgment.createdBy).toBeDefined();
    });
  });
});