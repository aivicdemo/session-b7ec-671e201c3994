import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-194: Data integrity validation with error detection', () => {
  it('should detect and record data consistency issues (duplicate records, timestamp contradictions, NULL values)', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'FL-USER-001',
      userAuthToken: 'valid-token',
    };

    const result = await validateAggregatedPerformanceData(input);

    // Verify execution timestamp
    expect(result.validationExecutedAt).toBeDefined();
    expect(result.validationExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify aggregation period
    expect(result.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-31');

    // Verify target team
    expect(result.targetTeamId).toBe('TEAM-001');

    // Verify record counts
    expect(result.totalRecordsProcessed).toBe(10);

    // Verify completeness assessment
    expect(result.completenessAssessment.status).toBe('WARNING');
    expect(result.completenessAssessment.missingFieldCount).toBe(0);
    expect(result.completenessAssessment.expectedRecordCount).toBe(10);
    expect(result.completenessAssessment.actualRecordCount).toBe(9);
    expect(result.completenessAssessment.completenessPercentage).toBe(90);
    expect(result.completenessAssessment.details).toContain(
      expect.stringContaining('実績件数が期待値より1件少なくなっています')
    );

    // Verify accuracy assessment
    expect(result.accuracyAssessment.status).toBe('FAIL');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(1);
    const timestampIssue = result.accuracyAssessment.details.find(
      (d) => d.field === 'timestamp' && d.issue.includes('矛盾')
    );
    expect(timestampIssue).toBeDefined();
    expect(timestampIssue?.issue).toContain('終了時刻が開始時刻より前');

    // Verify anomaly detection
    expect(result.anomalyDetection.status).toBe('DETECTED');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(2);
    expect(result.anomalyDetection.anomalies.length).toBe(2);

    const processingTimeAnomaly = result.anomalyDetection.anomalies.find(
      (a) => a.field === 'processingTime'
    );
    expect(processingTimeAnomaly).toBeDefined();
    expect(processingTimeAnomaly?.recordId).toBe('REC-003');
    expect(processingTimeAnomaly?.workerId).toBe('WORKER-003');
    expect(processingTimeAnomaly?.anomalyType).toBe('STATISTICAL_OUTLIER');
    expect(processingTimeAnomaly?.severity).toBe('MEDIUM');
    expect(processingTimeAnomaly?.currentValue).toBe(450);
    expect(processingTimeAnomaly?.recommendedAction).toContain('作業方法を確認してください');

    const errorRateAnomaly = result.anomalyDetection.anomalies.find(
      (a) => a.field === 'errorRate'
    );
    expect(errorRateAnomaly).toBeDefined();
    expect(errorRateAnomaly?.recordId).toBe('REC-005');
    expect(errorRateAnomaly?.workerId).toBe('WORKER-005');
    expect(errorRateAnomaly?.anomalyType).toBe('BUSINESS_RULE_VIOLATION');
    expect(errorRateAnomaly?.severity).toBe('HIGH');
    expect(errorRateAnomaly?.currentValue).toBe(0.15);
    expect(errorRateAnomaly?.recommendedAction).toContain('品質指導を実施してください');

    // Verify overall quality judgment
    expect(result.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');
    expect(result.overallQualityJudgment.qualityScore).toBe(72);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(false);
    expect(result.overallQualityJudgment.judgmentReason).toContain('軽微な問題');

    // Verify improvement guidance
    expect(result.improvementGuidance.length).toBe(3);

    const duplicateGuidance = result.improvementGuidance.find(
      (g) => g.category === 'COMPLETENESS'
    );
    expect(duplicateGuidance).toBeDefined();
    expect(duplicateGuidance?.priority).toBe('HIGH');
    expect(duplicateGuidance?.action).toContain('重複レコード');
    expect(duplicateGuidance?.affectedRecordCount).toBe(1);
    expect(duplicateGuidance?.targetCompletionDate).toBe('2024-02-01');

    const timestampGuidance = result.improvementGuidance.find(
      (g) => g.category === 'ACCURACY'
    );
    expect(timestampGuidance).toBeDefined();
    expect(timestampGuidance?.priority).toBe('CRITICAL');
    expect(timestampGuidance?.action).toContain('タイムスタンプ');
    expect(timestampGuidance?.affectedRecordCount).toBe(1);
    expect(timestampGuidance?.estimatedResolutionTime).toBe('1時間');

    const qualityGuidance = result.improvementGuidance.find(
      (g) => g.category === 'ANOMALY'
    );
    expect(qualityGuidance).toBeDefined();
    expect(qualityGuidance?.priority).toBe('HIGH');
    expect(qualityGuidance?.action).toContain('品質指導');
    expect(qualityGuidance?.affectedRecordCount).toBe(1);
    expect(qualityGuidance?.targetCompletionDate).toBe('2024-02-02');

    // Verify notification sent
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('FL-USER-001');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
  });
});