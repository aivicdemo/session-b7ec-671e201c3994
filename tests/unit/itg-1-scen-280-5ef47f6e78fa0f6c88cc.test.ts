import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-280: 返却配置案の件数が maxResultCount を超えない', () => {
  it('maxResultCount を超える配置案が返却された場合、出力は maxResultCount 以下に制限される', async () => {
    const userId = 'center-001';
    const targetFacilityIds = ['fac-A', 'fac-B'];
    const timeRangeStart = '2025-01-15T09:00:00Z';
    const timeRangeEnd = '2025-01-15T18:00:00Z';
    const priorityFilter = 'all';
    const maxResultCount = 50;

    const beforeCallTime = new Date();

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    expect(result.allocationPlans.length).toBeLessThanOrEqual(maxResultCount);
    expect(result.allocationPlans.length).toBe(Math.min(maxResultCount, result.totalCount));
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.analysisCompletedAt).toBeDefined();
    const analysisTime = new Date(result.analysisCompletedAt);
    expect(analysisTime.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });

  it('maxResultCount に達しない配置案の場合、全件が返却される', async () => {
    const userId = 'center-001';
    const targetFacilityIds = ['fac-A'];
    const timeRangeStart = '2025-01-15T09:00:00Z';
    const timeRangeEnd = '2025-01-15T18:00:00Z';
    const priorityFilter = 'high';
    const maxResultCount = 50;

    const beforeCallTime = new Date();

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    expect(result.allocationPlans.length).toBeLessThanOrEqual(maxResultCount);
    expect(result.allocationPlans.length).toBe(result.totalCount);
    expect(result.analysisCompletedAt).toBeDefined();
    const analysisTime = new Date(result.analysisCompletedAt);
    expect(analysisTime.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
  });

  it('maxResultCount がデフォルト値で機能する場合、50件以下が返却される', async () => {
    const userId = 'center-001';
    const targetFacilityIds = ['fac-A', 'fac-B'];
    const timeRangeStart = '2025-01-15T09:00:00Z';
    const timeRangeEnd = '2025-01-15T18:00:00Z';
    const priorityFilter = 'all';

    const beforeCallTime = new Date();

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
    });

    expect(result.allocationPlans.length).toBeLessThanOrEqual(50);
    expect(result.analysisCompletedAt).toBeDefined();
    const analysisTime = new Date(result.analysisCompletedAt);
    expect(analysisTime.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });
});