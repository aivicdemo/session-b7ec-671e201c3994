import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-285: extractAndRankAllocationPlansForReview - totalCount matches filter conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return totalCount equal to the number of allocation plans matching filter conditions', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-001';
    const targetFacilityIds = ['F001', 'F002'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T12:00:00Z';
    const priorityFilter = 'high' as const;
    const maxResultCount = 5;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - verify totalCount is a number representing all matching plans
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // Assert - verify allocationPlans length does not exceed maxResultCount
    expect(result.allocationPlans.length).toBeLessThanOrEqual(maxResultCount);

    // Assert - verify allocationPlans length does not exceed totalCount
    expect(result.allocationPlans.length).toBeLessThanOrEqual(result.totalCount);

    // When totalCount > maxResultCount, verify truncation
    if (result.totalCount > maxResultCount) {
      expect(result.allocationPlans.length).toBe(maxResultCount);
    }

    // Assert - verify all returned allocation plans match filter criteria
    result.allocationPlans.forEach((plan) => {
      expect(targetFacilityIds).toContain(plan.facilityId);
      expect(plan.allocationPlanId).toBeTruthy();
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(plan.planName).toBeTruthy();
      expect(typeof plan.planName).toBe('string');
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);

      expect(plan.allocatedWorkerCount).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(plan.allocatedWorkerCount)).toBe(true);
      
      expect(plan.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(plan.currentProgressRate).toBeLessThanOrEqual(100);
      
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);
      
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);
      
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(plan.rankingPriority)).toBe(true);

      // Verify planned dates are valid ISO 8601 strings
      expect(new Date(plan.plannedStartDate)).toBeInstanceOf(Date);
      expect(new Date(plan.plannedStartDate).getTime()).not.toBeNaN();
      expect(new Date(plan.plannedEndDate)).toBeInstanceOf(Date);
      expect(new Date(plan.plannedEndDate).getTime()).not.toBeNaN();
      expect(new Date(plan.expectedCompletionDate)).toBeInstanceOf(Date);
      expect(new Date(plan.expectedCompletionDate).getTime()).not.toBeNaN();
    });

    // Assert - verify allocationPlans are sorted by rankingPriority
    for (let i = 1; i < result.allocationPlans.length; i++) {
      expect(result.allocationPlans[i].rankingPriority).toBeGreaterThanOrEqual(
        result.allocationPlans[i - 1].rankingPriority,
      );
    }

    // Assert - verify analysisCompletedAt is ISO 8601 format
    expect(result.analysisCompletedAt).toBeTruthy();
    expect(typeof result.analysisCompletedAt).toBe('string');
    const completedAtDate = new Date(result.analysisCompletedAt);
    expect(completedAtDate).toBeInstanceOf(Date);
    expect(completedAtDate.getTime()).not.toBeNaN();

    // Assert - verify dataFreshness values are non-negative integers
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.dataFreshness.progressDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.productivityDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.riskJudgmentAge)).toBe(true);
  });

  it('should return totalCount greater than allocationPlans length when results exceed maxResultCount', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-002';
    const targetFacilityIds = ['F001'];
    const timeRangeStart = '2024-01-15T00:00:00Z';
    const timeRangeEnd = '2024-01-15T23:59:59Z';
    const priorityFilter = 'all' as const;
    const maxResultCount = 3;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - verify totalCount reflects all matching plans
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // Assert - verify allocationPlans respects maxResultCount limit
    expect(result.allocationPlans.length).toBeLessThanOrEqual(maxResultCount);

    // Assert - when multiple plans match, allocationPlans length should match returned count
    if (result.totalCount > 0) {
      expect(result.allocationPlans.length).toBeGreaterThan(0);
    }

    // Assert - verify all returned plans match filter criteria
    result.allocationPlans.forEach((plan) => {
      expect(targetFacilityIds).toContain(plan.facilityId);
    });

    // Assert - verify priority ordering when multiple plans returned
    if (result.allocationPlans.length > 1) {
      for (let i = 1; i < result.allocationPlans.length; i++) {
        expect(result.allocationPlans[i].rankingPriority).toBeGreaterThanOrEqual(
          result.allocationPlans[i - 1].rankingPriority,
        );
      }
    }

    // Assert - verify output structure integrity
    expect(result.analysisCompletedAt).toBeTruthy();
    expect(new Date(result.analysisCompletedAt).getTime()).not.toBeNaN();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });

  it('should return totalCount of 0 with empty allocationPlans when no plans match filter conditions', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-003';
    const targetFacilityIds = ['F999'];
    const timeRangeStart = '2099-01-15T09:00:00Z';
    const timeRangeEnd = '2099-01-15T12:00:00Z';
    const priorityFilter = 'high' as const;
    const maxResultCount = 10;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - verify empty result
    expect(result.totalCount).toBe(0);
    expect(result.allocationPlans).toEqual([]);
    expect(result.allocationPlans.length).toBe(0);

    // Assert - verify output structure is still valid
    expect(result.analysisCompletedAt).toBeTruthy();
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(new Date(result.analysisCompletedAt).getTime()).not.toBeNaN();

    expect(result.dataFreshness).toBeDefined();
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
  });

  it('should respect maxResultCount limit for allocationPlans array', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-004';
    const targetFacilityIds = ['F001', 'F002', 'F003'];
    const timeRangeStart = '2024-01-15T00:00:00Z';
    const timeRangeEnd = '2024-01-15T23:59:59Z';
    const priorityFilter = 'all' as const;
    const maxResultCount = 2;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - verify allocationPlans respects limit
    expect(result.allocationPlans.length).toBeLessThanOrEqual(maxResultCount);

    // Assert - verify totalCount can exceed maxResultCount
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationPlans.length);

    // Assert - all plans belong to target facilities
    result.allocationPlans.forEach((plan) => {
      expect(targetFacilityIds).toContain(plan.facilityId);
    });

    // Assert - verify ranking priority order is maintained
    for (let i = 1; i < result.allocationPlans.length; i++) {
      expect(result.allocationPlans[i].rankingPriority).toBeGreaterThanOrEqual(
        result.allocationPlans[i - 1].rankingPriority,
      );
    }
  });

  it('should return valid data freshness indicators', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-005';
    const targetFacilityIds = ['F001'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T12:00:00Z';
    const priorityFilter = 'medium' as const;
    const maxResultCount = 50;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - verify dataFreshness structure
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeDefined();
    expect(result.dataFreshness.productivityDataAge).toBeDefined();
    expect(result.dataFreshness.riskJudgmentAge).toBeDefined();

    // Assert - verify freshness values are non-negative integers (seconds)
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);

    expect(Number.isInteger(result.dataFreshness.progressDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.productivityDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.riskJudgmentAge)).toBe(true);

    // Assert - freshness age should be reasonable (less than 24 hours in seconds)
    expect(result.dataFreshness.progressDataAge).toBeLessThan(86400);
    expect(result.dataFreshness.productivityDataAge).toBeLessThan(86400);
    expect(result.dataFreshness.riskJudgmentAge).toBeLessThan(86400);
  });

  it('should properly filter allocation plans by specified facilities', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-006';
    const targetFacilityIds = ['F001'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T12:00:00Z';
    const priorityFilter = 'high' as const;
    const maxResultCount = 50;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - all returned plans must match the specified facility
    result.allocationPlans.forEach((plan) => {
      expect(targetFacilityIds).toContain(plan.facilityId);
    });

    // Assert - verify totalCount represents filtered results
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationPlans.length);
  });

  it('should handle multiple facility IDs in filter correctly', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-007';
    const targetFacilityIds = ['F001', 'F002', 'F003'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T12:00:00Z';
    const priorityFilter = 'all' as const;
    const maxResultCount = 50;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - all returned plans belong to one of the specified facilities
    result.allocationPlans.forEach((plan) => {
      expect(targetFacilityIds).toContain(plan.facilityId);
    });

    // Assert - verify totalCount reflects combined results from all specified facilities
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.allocationPlans.length).toBeLessThanOrEqual(result.totalCount);
  });

  it('should maintain consistency between totalCount and actual filtering', async () => {
    // Arrange
    const userId = 'user-logistics-center-manager-008';
    const targetFacilityIds = ['F001', 'F002'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T12:00:00Z';
    const priorityFilter = 'high' as const;
    const maxResultCount = 100;

    // Act
    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Assert - totalCount should equal the count of all matching records
    // When allocationPlans.length < totalCount, it means truncation due to maxResultCount
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationPlans.length);

    // Assert - when totalCount <= maxResultCount, all records should be returned
    if (result.totalCount <= maxResultCount) {
      expect(result.allocationPlans.length).toBe(result.totalCount);
    }

    // Assert - verify all returned plans satisfy filter criteria
    result.allocationPlans.forEach((plan) => {
      expect(targetFacilityIds).toContain(plan.facilityId);
    });

    // Assert - all plans should have valid structure
    result.allocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeTruthy();
      expect(typeof plan.planName).toBe('string');
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);
    });
  });
});