import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import { ValidateAggregatedPerformanceDataInput } from '../../src/logic/data-quality-validation';

describe('SCEN-175: 正常系：集約期間内のデータに重大な欠落と複数の異常値が検出され、品質判定が却下されて改善指示が優先度高で生成される', () => {
  const now = new Date();
  const aggregationPeriodStartDate = '2024-01-01T00:00:00Z';
  const aggregationPeriodEndDate = '2024-01-31T23:59:59Z';
  const teamId = 'team-001';
  const fieldLeaderUserId = 'user-fl-001';
  const userAuthToken = 'valid-token-field-leader';
  const siteId = 'site-001';

  it('should validate aggregated performance data with critical failures and anomalies, returning REJECTED judgment with CRITICAL improvement guidance', async () => {
    const input: ValidateAggregatedPerformanceDataInput = {
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      teamId,
      siteId,
      fieldLeaderUserId,
      userAuthToken,
    };

    const result = await validateAggregatedPerformanceData(input);

    // 1. validationExecutedAt は現在の ISO 8601 形式の日時である
    expect(result.validationExecutedAt).toBeDefined();
    expect(typeof result.validationExecutedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.validationExecutedAt)).toBe(true);

    // 2. aggregationPeriod は入力値を反映している
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe(aggregationPeriodStartDate);
    expect(result.aggregationPeriod.endDate).toBe(aggregationPeriodEndDate);

    // 3. targetTeamId は入力値と一致している
    expect(result.targetTeamId).toBe(teamId);

    // 4. totalRecordsProcessed は取得されたデータの総件数である
    expect(result.totalRecordsProcessed).toBeGreaterThan(0);
    expect(typeof result.totalRecordsProcessed).toBe('number');

    // 5. completenessAssessment は FAIL、30%欠落、充足率70%
    expect(result.completenessAssessment).toBeDefined();
    expect(result.completenessAssessment.status).toBe('FAIL');
    expect(result.completenessAssessment.missingFieldCount).toBeGreaterThan(0);
    expect(result.completenessAssessment.expectedRecordCount).toBeGreaterThan(result.completenessAssessment.actualRecordCount);
    expect(result.completenessAssessment.completenessPercentage).toBeLessThan(100);
    expect(result.completenessAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(result.completenessAssessment.details).toEqual(expect.any(Array));
    expect(result.completenessAssessment.details.length).toBeGreaterThan(0);

    // 6. accuracyAssessment は FAIL、矛盾件数と範囲外件数あり、詳細情報が存在
    expect(result.accuracyAssessment).toBeDefined();
    expect(result.accuracyAssessment.status).toBe('FAIL');
    expect(result.accuracyAssessment.inconsistencyCount).toBeGreaterThan(0);
    expect(result.accuracyAssessment.outOfRangeCount).toBeGreaterThan(0);
    expect(result.accuracyAssessment.details).toEqual(expect.any(Array));
    expect(result.accuracyAssessment.details.length).toBeGreaterThan(0);
    result.accuracyAssessment.details.forEach((detail) => {
      expect(detail.recordId).toBeDefined();
      expect(detail.field).toBeDefined();
      expect(detail.issue).toBeDefined();
      expect(detail.actualValue).toBeDefined();
    });

    // 7. anomalyDetection は DETECTED、複数の異常を含む
    expect(result.anomalyDetection).toBeDefined();
    expect(result.anomalyDetection.status).toBe('DETECTED');
    expect(result.anomalyDetection.anomalousRecordCount).toBeGreaterThan(0);
    expect(result.anomalyDetection.anomalies).toEqual(expect.any(Array));
    expect(result.anomalyDetection.anomalies.length).toBeGreaterThan(0);
    result.anomalyDetection.anomalies.forEach((anomaly) => {
      expect(anomaly.recordId).toBeDefined();
      expect(anomaly.workerId).toBeDefined();
      expect(anomaly.field).toBeDefined();
      expect(['STATISTICAL_OUTLIER', 'BUSINESS_RULE_VIOLATION']).toContain(anomaly.anomalyType);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(anomaly.severity);
      expect(anomaly.currentValue).toBeDefined();
      expect(anomaly.recommendedAction).toBeDefined();
    });

    // 8. overallQualityJudgment は REJECTED、品質スコア低め、承認不可
    expect(result.overallQualityJudgment).toBeDefined();
    expect(result.overallQualityJudgment.judgment).toBe('REJECTED');
    expect(result.overallQualityJudgment.qualityScore).toBeLessThan(50);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(false);
    expect(result.overallQualityJudgment.judgmentReason).toBeDefined();
    expect(typeof result.overallQualityJudgment.judgmentReason).toBe('string');

    // 9. improvementGuidance は複数の指示を含む、CRITICAL を含む
    expect(result.improvementGuidance).toEqual(expect.any(Array));
    expect(result.improvementGuidance.length).toBeGreaterThanOrEqual(3);
    const criticalGuidance = result.improvementGuidance.find((g) => g.priority === 'CRITICAL');
    expect(criticalGuidance).toBeDefined();
    expect(criticalGuidance?.category).toBe('COMPLETENESS');
    expect(criticalGuidance?.affectedRecordCount).toBeGreaterThan(0);
    expect(criticalGuidance?.estimatedResolutionTime).toBeDefined();
    expect(criticalGuidance?.targetCompletionDate).toBeDefined();
    const highGuidanceAccuracy = result.improvementGuidance.find(
      (g) => g.priority === 'HIGH' && g.category === 'ACCURACY',
    );
    const highGuidanceAnomaly = result.improvementGuidance.find(
      (g) => g.priority === 'HIGH' && g.category === 'ANOMALY',
    );
    expect(highGuidanceAccuracy).toBeDefined();
    expect(highGuidanceAnomaly).toBeDefined();

    // 10. notificationSent は送信済み、fieldLeaderUserId に配信、DELIVERED
    expect(result.notificationSent).toBeDefined();
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe(fieldLeaderUserId);
    expect(result.notificationSent.notificationTimestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.notificationSent.notificationTimestamp)).toBe(true);
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');

    // 11. エラーは発生していない
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});