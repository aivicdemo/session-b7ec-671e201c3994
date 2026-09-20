import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

describe('SCEN-193: 正常系：品質スコアが80未満の場合、追加対応が必要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('品質スコア75で CONDITIONAL_APPROVAL と改善指示が返却される', async () => {
    const mockProductivityRecords = Array.from({ length: 31 }, (_, i) => ({
      productivityDataId: `rec-${i + 1}`,
      workerId: `worker-${(i % 5) + 1}`,
      plannedWorkingHours: 8,
      actualWorkingHours: 8,
      completedCount: 50 + (i % 10),
      productivityRate: 85 + (i % 10),
      qualityScore: 80 + (i % 5),
      errorCount: i % 3,
      proficiencyLevel: 'intermediate',
    }));

    const mockCompletenessResult = {
      status: 'PASS' as const,
      missingFieldCount: 0,
      expectedRecordCount: 31,
      actualRecordCount: 31,
      completenessPercentage: 100,
      details: [],
    };

    const mockAccuracyResult = {
      status: 'PASS' as const,
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    };

    const mockAnomalyResult = {
      status: 'PASS' as const,
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString(),
    };

    const mockJudgmentResult = {
      judgment: 'CONDITIONAL_APPROVAL' as const,
      judgmentReason: '品質スコアが80未満のため、追加対応が必要です',
      qualityScore: 75,
      approvalEligibility: false,
      componentScores: {
        completenessScore: 100,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    };

    const mockImprovementGuidance = [
      {
        priority: 'MEDIUM' as const,
        category: 'COMPLETENESS' as const,
        action: '品質スコアの改善が必要です',
        affectedRecordCount: 2,
        estimatedResolutionTime: '1日',
        targetCompletionDate: '2024-02-01',
      },
    ];

    const mockNotificationResult = {
      sent: true,
      recipientUserId: 'FL-USER-001',
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED' as const,
    };

    // ステップ2：authenticateUser をモック
    const mockAuthenticateUser = jest
      .spyOn(dataQualityValidation as any, 'authenticateUser')
      .mockResolvedValue({ userId: 'FL-USER-001', role: 'fieldLeader' });

    // ステップ3：authorizeUserAction をモック
    const mockAuthorizeUserAction = jest
      .spyOn(dataQualityValidation as any, 'authorizeUserAction')
      .mockResolvedValue({ authorized: true });

    // ステップ4：findProductivityDataByTeamAndPeriod をモック
    const mockFindProductivityData = jest
      .spyOn(dataQualityValidation as any, 'findProductivityDataByTeamAndPeriod')
      .mockResolvedValue(mockProductivityRecords);

    // ステップ5：assessDataCompleteness をモック
    const mockAssessCompleteness = jest
      .spyOn(dataQualityValidation as any, 'assessDataCompleteness')
      .mockResolvedValue(mockCompletenessResult);

    // ステップ6：assessDataAccuracy をモック
    const mockAssessAccuracy = jest
      .spyOn(dataQualityValidation as any, 'assessDataAccuracy')
      .mockResolvedValue(mockAccuracyResult);

    // ステップ7：detectAnomalousValues をモック
    const mockDetectAnomalies = jest
      .spyOn(dataQualityValidation as any, 'detectAnomalousValues')
      .mockResolvedValue(mockAnomalyResult);

    // ステップ8：generateQualityJudgment をモック
    const mockGenerateQualityJudgment = jest
      .spyOn(dataQualityValidation as any, 'generateQualityJudgment')
      .mockResolvedValue(mockJudgmentResult);

    // ステップ9：generateImprovementGuidance をモック
    const mockGenerateImprovementGuidance = jest
      .spyOn(dataQualityValidation as any, 'generateImprovementGuidance')
      .mockResolvedValue(mockImprovementGuidance);

    // ステップ10：sendQualityValidationResultToFieldLeader をモック
    const mockSendNotification = jest
      .spyOn(dataQualityValidation as any, 'sendQualityValidationResultToFieldLeader')
      .mockResolvedValue(mockNotificationResult);

    // ステップ11：validateAggregatedPerformanceData を呼び出す
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'FL-USER-001',
      userAuthToken: 'valid-token-xyz',
    };

    const result = await validateAggregatedPerformanceData(input);

    // 各ステップの呼び出しを検証
    expect(mockAuthenticateUser).toHaveBeenCalledWith('valid-token-xyz');
    expect(mockAuthorizeUserAction).toHaveBeenCalledWith(
      'FL-USER-001',
      'validateAggregatedPerformanceData'
    );
    expect(mockFindProductivityData).toHaveBeenCalledWith(
      'TEAM-001',
      '2024-01-01',
      '2024-01-31'
    );
    expect(mockAssessCompleteness).toHaveBeenCalled();
    expect(mockAssessAccuracy).toHaveBeenCalled();
    expect(mockDetectAnomalies).toHaveBeenCalled();
    expect(mockGenerateQualityJudgment).toHaveBeenCalled();
    expect(mockGenerateImprovementGuidance).toHaveBeenCalled();
    expect(mockSendNotification).toHaveBeenCalledWith(
      'FL-USER-001',
      expect.objectContaining({
        overallQualityJudgment: expect.objectContaining({
          qualityScore: 75,
          judgment: 'CONDITIONAL_APPROVAL',
        }),
      })
    );

    // (1) validationExecutedAtはISO8601形式の日時である
    expect(result.validationExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // (2) aggregationPeriod={startDate:'2024-01-01'、endDate:'2024-01-31'}である
    expect(result.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-31');

    // (3) targetTeamId='TEAM-001'である
    expect(result.targetTeamId).toBe('TEAM-001');

    // (4) totalRecordsProcessed=31である
    expect(result.totalRecordsProcessed).toBe(31);

    // (5) completenessAssessment.status='PASS'、completenessPercentage=100である
    expect(result.completenessAssessment.status).toBe('PASS');
    expect(result.completenessAssessment.completenessPercentage).toBe(100);

    // (6) accuracyAssessment.status='PASS'、inconsistencyCount=0である
    expect(result.accuracyAssessment.status).toBe('PASS');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(0);

    // (7) anomalyDetection.status='PASS'、anomalousRecordCount=0である
    expect(result.anomalyDetection.status).toBe('PASS');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(0);

    // (8) overallQualityJudgment.qualityScore=75である
    expect(result.overallQualityJudgment.qualityScore).toBe(75);

    // (9) overallQualityJudgment.judgment='CONDITIONAL_APPROVAL'である
    expect(result.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');

    // (10) overallQualityJudgment.approvalEligibility=falseである
    expect(result.overallQualityJudgment.approvalEligibility).toBe(false);

    // (11) overallQualityJudgment.judgmentReasonは「品質スコアが80未満のため、追加対応が必要です」を含む文言である
    expect(result.overallQualityJudgment.judgmentReason).toContain(
      '品質スコアが80未満'
    );
    expect(result.overallQualityJudgment.judgmentReason).toContain('追加対応');

    // (12) improvementGuidanceは1件以上の要素を持つ配列
    expect(Array.isArray(result.improvementGuidance)).toBe(true);
    expect(result.improvementGuidance.length).toBeGreaterThanOrEqual(1);

    const hasValidGuidance = result.improvementGuidance.some((item) => {
      const validPriority = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(
        item.priority
      );
      const validCategory = ['COMPLETENESS', 'ACCURACY', 'ANOMALY'].includes(
        item.category
      );
      const hasAction = typeof item.action === 'string' && item.action.length > 0;
      const hasAffectedRecordCount =
        typeof item.affectedRecordCount === 'number';
      const hasEstimatedResolutionTime =
        typeof item.estimatedResolutionTime === 'string' &&
        item.estimatedResolutionTime.length > 0;
      const targetCompletionDateMatches = item.targetCompletionDate.match(
        /^\d{4}-\d{2}-\d{2}/
      );

      return (
        validPriority &&
        validCategory &&
        hasAction &&
        hasAffectedRecordCount &&
        hasEstimatedResolutionTime &&
        targetCompletionDateMatches !== null
      );
    });
    expect(hasValidGuidance).toBe(true);

    // (13) notificationSent.sent=true、notificationSent.recipientUserId='FL-USER-001'、notificationSent.deliveryStatus='DELIVERED'である
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('FL-USER-001');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');

    // notificationTimestampはISO8601形式である
    expect(result.notificationSent.notificationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});