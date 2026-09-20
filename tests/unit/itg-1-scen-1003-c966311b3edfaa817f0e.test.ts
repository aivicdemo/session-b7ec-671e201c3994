import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1003: ページネーションで指定ページの結果を取得する', () => {
  it('should retrieve paginated results for page 2 with HIGH risk level and 未対応 status', async () => {
    // Prepare test search conditions
    const searchCondition = {
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'judgmentDateTime',
      sortOrder: 'DESC',
      riskLevels: ['HIGH'],
      actionStatuses: ['未対応'],
      riskJudgmentIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
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
    };

    // Call the function with search conditions
    const result = await listDelayRiskJudgmentByCondition(searchCondition);

    // Verify output type fields
    // (1) delayRiskJudgments array contains exactly 10 elements for page 2 when totalCount >= 20
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);
    if (result.totalCount >= 20) {
      expect(result.delayRiskJudgments.length).toBe(10);
    } else {
      expect(result.delayRiskJudgments.length).toBeLessThanOrEqual(10);
    }

    // (2) pageNumber and pageSize are returned as specified
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);

    // (3) totalCount reflects the total number of matching records
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // (4) retrievedAt is in ISO 8601 format
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoDateRegex.test(result.retrievedAt)).toBe(true);

    // (5) Verify each element matches filter conditions and sort order
    result.delayRiskJudgments.forEach((judgment) => {
      expect(judgment.riskLevel).toBe('HIGH');
      expect(judgment.actionStatus).toBe('未対応');
    });

    // Verify sort order: DESC by judgmentDateTime
    if (result.delayRiskJudgments.length > 1) {
      for (let i = 0; i < result.delayRiskJudgments.length - 1; i++) {
        const currentDate = new Date(result.delayRiskJudgments[i].judgmentDateTime);
        const nextDate = new Date(result.delayRiskJudgments[i + 1].judgmentDateTime);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    }
  });
});