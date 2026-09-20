import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-192: 品質スコアが80以上の場合、追加対応が不要と判定される', () => {
  it('should approve validation and require no improvement actions when quality score is 80 or above', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'team-001',
      fieldLeaderUserId: 'leader-001',
      userAuthToken: 'valid-token-123',
    };

    const result = await validateAggregatedPerformanceData(input);

    expect(result.validationExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.aggregationPeriod).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(result.targetTeamId).toBe('team-001');
    expect(result.totalRecordsProcessed).toBe(15);

    expect(result.completenessAssessment).toEqual({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 15,
      actualRecordCount: 15,
      completenessPercentage: 100,
      details: [],
    });

    expect(result.accuracyAssessment).toEqual({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    expect(result.anomalyDetection).toEqual({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
    });

    expect(result.overallQualityJudgment.judgment).toBe('APPROVED');
    expect(result.overallQualityJudgment.qualityScore).toBeGreaterThanOrEqual(80);
    expect(result.overallQualityJudgment.qualityScore).toBeLessThanOrEqual(100);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(true);
    expect(result.overallQualityJudgment.judgmentReason).toBeTruthy();

    expect(result.improvementGuidance).toEqual([]);

    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('leader-001');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
    expect(result.notificationSent.notificationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});