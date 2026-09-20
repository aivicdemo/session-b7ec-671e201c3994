import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-198: 正常系：正確性検証で矛盾件数と範囲外件数が整理されて出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return accuracy assessment with inconsistency and out-of-range counts properly organized', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'T001',
      fieldLeaderUserId: 'FL001',
      userAuthToken: 'valid-token',
    };

    const result = await validateAggregatedPerformanceData(input);

    expect(result).toBeDefined();
    expect(result.validationExecutedAt).toBeDefined();
    expect(result.aggregationPeriod).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(result.targetTeamId).toBe('T001');
    expect(result.totalRecordsProcessed).toBe(50);

    expect(result.completenessAssessment).toEqual({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 50,
      actualRecordCount: 50,
      completenessPercentage: 100,
      details: [],
    });

    expect(result.accuracyAssessment).toBeDefined();
    expect(result.accuracyAssessment.status).toBe('FAIL');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(2);
    expect(result.accuracyAssessment.outOfRangeCount).toBe(3);

    expect(result.accuracyAssessment.details).toHaveLength(5);
    const inconsistencyRecords = result.accuracyAssessment.details.filter(
      (d) => d.issue.includes('矛盾') || d.issue.includes('終了時刻が開始時刻より前')
    );
    expect(inconsistencyRecords).toHaveLength(2);

    const outOfRangeRecords = result.accuracyAssessment.details.filter(
      (d) => d.issue.includes('範囲外')
    );
    expect(outOfRangeRecords).toHaveLength(3);

    expect(result.accuracyAssessment.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordId: 'R001',
          field: 'endTime',
          expectedRange: expect.any(String),
          actualValue: expect.any(String),
        }),
      ])
    );

    expect(result.anomalyDetection).toBeDefined();
    expect(result.anomalyDetection.status).toBe('DETECTED');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(2);
    expect(result.anomalyDetection.anomalies).toHaveLength(2);

    expect(result.overallQualityJudgment).toBeDefined();
    expect(result.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');
    expect(result.overallQualityJudgment.qualityScore).toBe(72);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(false);

    expect(result.improvementGuidance).toBeDefined();
    expect(result.improvementGuidance.length).toBeGreaterThanOrEqual(3);

    const criticalGuidance = result.improvementGuidance.find(
      (g) => g.priority === 'CRITICAL' && g.category === 'ACCURACY'
    );
    expect(criticalGuidance).toBeDefined();
    expect(criticalGuidance?.affectedRecordCount).toBe(2);

    const highGuidance = result.improvementGuidance.find(
      (g) => g.priority === 'HIGH' && g.category === 'ACCURACY'
    );
    expect(highGuidance).toBeDefined();
    expect(highGuidance?.affectedRecordCount).toBe(3);

    const mediumGuidance = result.improvementGuidance.find(
      (g) => g.priority === 'MEDIUM' && g.category === 'ANOMALY'
    );
    expect(mediumGuidance).toBeDefined();

    expect(result.notificationSent).toBeDefined();
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('FL001');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
  });

  it('should accurately count and categorize accuracy assessment issues', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'T001',
      fieldLeaderUserId: 'FL001',
      userAuthToken: 'valid-token',
    };

    const result = await validateAggregatedPerformanceData(input);

    const details = result.accuracyAssessment.details;

    const inconsistencyCount = details.filter(
      (d) => d.field === 'endTime' && d.issue.includes('時刻')
    ).length;
    expect(inconsistencyCount).toBe(2);

    const errorRateOutOfRange = details.filter(
      (d) => d.field === 'errorRate'
    ).length;
    expect(errorRateOutOfRange).toBe(2);

    const processingTimeOutOfRange = details.filter(
      (d) => d.field === 'processingTime'
    ).length;
    expect(processingTimeOutOfRange).toBe(1);

    expect(result.accuracyAssessment.inconsistencyCount).toBe(
      inconsistencyCount
    );
    expect(result.accuracyAssessment.outOfRangeCount).toBe(
      errorRateOutOfRange + processingTimeOutOfRange
    );
  });
});