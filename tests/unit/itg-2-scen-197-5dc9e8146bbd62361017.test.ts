import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-197: 正常系：完全性検証で充足率と欠落フィールド数が正確に計算されて出力される', () => {
  it('should accurately calculate and output completeness percentage and missing field count in completenessAssessment', async () => {
    // Setup input parameters
    const aggregationPeriodStartDate = '2024-01-15';
    const aggregationPeriodEndDate = '2024-01-21';
    const teamId = 'TEAM-001';
    const fieldLeaderUserId = 'USER-FL-001';
    const userAuthToken = 'valid-token';

    // Call the target function
    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      teamId,
      fieldLeaderUserId,
      userAuthToken,
    });

    // Verify completenessAssessment
    expect(result.completenessAssessment).toBeDefined();
    expect(result.completenessAssessment.status).toBe('PASS');
    expect(result.completenessAssessment.missingFieldCount).toBe(0);
    expect(result.completenessAssessment.completenessPercentage).toBe(100.0);
    expect(result.completenessAssessment.details).toContain(
      expect.stringMatching(/すべての必須フィールドが揃っています|complete/)
    );

    // Verify expectedRecordCount and actualRecordCount are present and equal
    expect(result.completenessAssessment.expectedRecordCount).toBeGreaterThanOrEqual(0);
    expect(result.completenessAssessment.actualRecordCount).toBeGreaterThanOrEqual(0);
    expect(result.completenessAssessment.actualRecordCount).toBe(
      result.completenessAssessment.expectedRecordCount
    );

    // Verify output structure
    expect(result.validationExecutedAt).toBeDefined();
    expect(result.validationExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe(aggregationPeriodStartDate);
    expect(result.aggregationPeriod.endDate).toBe(aggregationPeriodEndDate);

    expect(result.targetTeamId).toBe(teamId);

    expect(result.totalRecordsProcessed).toBeGreaterThanOrEqual(0);
  });
});