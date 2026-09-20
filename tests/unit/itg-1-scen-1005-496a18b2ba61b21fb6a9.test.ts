import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1005: Data retrieval for progress delay risk judgment results', () => {
  it('should return retrievedAt field in ISO 8601 format', async () => {
    // Arrange
    const input = {
      facilityIds: ['F001'],
      teamIds: ['T001'],
      riskLevels: ['HIGH'],
      actionStatuses: ['未対応'],
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'judgmentDateTime',
      sortOrder: 'DESC',
    };

    // Act
    const result = await listDelayRiskJudgmentByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.retrievedAt).toBeDefined();

    // Verify retrievedAt is in ISO 8601 format
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    // Verify retrievedAt represents a valid date
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeTruthy();
    expect(Number.isNaN(retrievedDate.getTime())).toBe(false);

    // Verify results contain expected data
    expect(result.delayRiskJudgments).toBeInstanceOf(Array);
    expect(result.delayRiskJudgments.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // Verify retrievedAt is close to current time (within reasonable tolerance)
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - retrievedDate.getTime());
    expect(timeDiff).toBeLessThan(60000); // Within 60 seconds
  });
});