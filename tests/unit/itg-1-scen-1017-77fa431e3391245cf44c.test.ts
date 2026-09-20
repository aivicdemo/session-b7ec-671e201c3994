import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';
import { ListDelayRiskJudgmentByConditionInput, ListDelayRiskJudgmentByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1017: listDelayRiskJudgmentByCondition - Edge case with no matching results', () => {
  it('should return empty array and totalCount 0 when no search conditions match any records', async () => {
    // Arrange: Construct input with all search condition fields set to null/undefined
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act: Call listDelayRiskJudgmentByCondition
    const result: ListDelayRiskJudgmentByConditionOutput = 
      await listDelayRiskJudgmentByCondition(input);

    // Assert: Verify output type fields
    expect(result.delayRiskJudgments).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    
    // Verify retrievedAt is a valid ISO 8601 format datetime string
    expect(result.retrievedAt).toBeTruthy();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });
});