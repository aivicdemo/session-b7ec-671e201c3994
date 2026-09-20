import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-270: extractAndRankAllocationPlansForReview - Invalid time range validation', () => {
  it('should throw InvalidFilterConditionError when timeRangeStart is after timeRangeEnd', async () => {
    const input = {
      userId: 'center-manager-001',
      targetFacilityIds: ['facility-A'],
      timeRangeStart: '2024-01-15T14:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    let caughtError: any;
    try {
      await extractAndRankAllocationPlansForReview(input);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('InvalidFilterConditionError');
    expect(caughtError.message).toContain('フィルタ条件が無効です');
    expect(caughtError.message).toContain('拠点ID');
    expect(caughtError.message).toContain('時間帯');
    expect(caughtError.message).toContain('優先度');
  });
});