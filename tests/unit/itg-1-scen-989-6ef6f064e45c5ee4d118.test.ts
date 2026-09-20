import {
  listDelayRiskJudgmentByCondition,
  ListDelayRiskJudgmentByConditionInput,
  ListDelayRiskJudgmentByConditionOutput,
  GetDelayRiskJudgmentByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-989: 検索条件を指定せずに全件を取得する', () => {
  it('should retrieve all delay risk judgment records when no search conditions are specified', async () => {
    const input: ListDelayRiskJudgmentByConditionInput = {
      riskJudgmentIds: null,
      workInstructionIds: null,
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

    const output: ListDelayRiskJudgmentByConditionOutput =
      await listDelayRiskJudgmentByCondition(input);

    expect(output.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgments)).toBe(true);

    output.delayRiskJudgments.forEach((item) => {
      expect(item).toHaveProperty('riskJudgmentId');
      expect(item).toHaveProperty('workInstructionId');
      expect(item).toHaveProperty('facilityId');
      expect(item).toHaveProperty('teamId');
      expect(item).toHaveProperty('judgmentDateTime');
      expect(item).toHaveProperty('riskLevel');
      expect(item).toHaveProperty('delayPredictionDays');
      expect(item).toHaveProperty('progressRate');
      expect(item).toHaveProperty('plannedProgressRate');
      expect(item).toHaveProperty('judgmentReason');
      expect(item).toHaveProperty('recommendedAction');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('createdBy');
    });

    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(0);

    expect(output.pageNumber).toBeNull();
    expect(output.pageSize).toBeNull();

    expect(typeof output.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.retrievedAt)).toBe(
      true
    );
  });
});