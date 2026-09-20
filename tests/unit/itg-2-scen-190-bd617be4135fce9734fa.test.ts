import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

describe('SCEN-190: 実績件数が期待件数の90%以上99%未満の場合、カバー率ステータスが警告として扱われる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('実績件数が期待件数の90%以上99%未満の場合、完全性ステータスがWARNINGとなり、品質判定がCONDITIONAL_APPROVALとなること', async () => {
    const authToken = 'test-token-12345';
    const fieldLeaderUserId = 'LEADER-001';
    const teamId = 'TEAM-001';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    jest.spyOn(dataQualityValidation, 'assessDataCompleteness' as any).mockReturnValue({
      status: 'WARNING',
      completenessPercentage: 95,
      expectedRecordCount: 100,
      actualRecordCount: 95,
      missingFieldCount: 0,
      details: ['実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。']
    });

    jest.spyOn(dataQualityValidation, 'assessDataAccuracy' as any).mockReturnValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    jest.spyOn(dataQualityValidation, 'detectAnomalousValues' as any).mockReturnValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    jest.spyOn(dataQualityValidation, 'generateQualityJudgment' as any).mockReturnValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性がWARNING状態（95%）です。条件付き承認可能ですが、改善が必要です。',
      qualityScore: 88,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 95,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    jest.spyOn(dataQualityValidation, 'generateImprovementGuidance' as any).mockReturnValue({
      guidanceItems: [
        {
          priority: 'MEDIUM',
          category: 'COMPLETENESS',
          action: '実績データ5件の欠落原因を調査し、次回報告までに改善してください。',
          affectedRecordCount: 5,
          estimatedResolutionTime: 'PT2H',
          targetCompletionDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 0
    });

    jest.spyOn(dataQualityValidation, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(
      Array(95).fill(null).map((_, i) => ({
        productivityDataId: `PROD-${i + 1}`,
        workerId: `WORKER-001`,
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'INTERMEDIATE'
      }))
    );

    jest.spyOn(dataQualityValidation, 'sendQualityValidationResultToFieldLeader' as any).mockResolvedValue({
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: startDate,
      aggregationPeriodEndDate: endDate,
      teamId: teamId,
      fieldLeaderUserId: fieldLeaderUserId,
      userAuthToken: authToken
    });

    expect(result.completenessAssessment.status).toBe('WARNING');
    expect(result.completenessAssessment.completenessPercentage).toBe(95);
    expect(result.completenessAssessment.expectedRecordCount).toBe(100);
    expect(result.completenessAssessment.actualRecordCount).toBe(95);
    expect(result.completenessAssessment.missingFieldCount).toBe(0);
    expect(result.completenessAssessment.details).toContain(
      '実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。'
    );
  });

  it('総合品質判定がCONDITIONAL_APPROVALとなり、品質スコアが88であること', async () => {
    const authToken = 'test-token-12345';
    const fieldLeaderUserId = 'LEADER-001';
    const teamId = 'TEAM-001';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    jest.spyOn(dataQualityValidation, 'assessDataCompleteness' as any).mockReturnValue({
      status: 'WARNING',
      completenessPercentage: 95,
      expectedRecordCount: 100,
      actualRecordCount: 95,
      missingFieldCount: 0,
      details: ['実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。']
    });

    jest.spyOn(dataQualityValidation, 'assessDataAccuracy' as any).mockReturnValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    jest.spyOn(dataQualityValidation, 'detectAnomalousValues' as any).mockReturnValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    jest.spyOn(dataQualityValidation, 'generateQualityJudgment' as any).mockReturnValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性がWARNING状態（95%）です。条件付き承認可能ですが、改善が必要です。',
      qualityScore: 88,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 95,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    jest.spyOn(dataQualityValidation, 'generateImprovementGuidance' as any).mockReturnValue({
      guidanceItems: [
        {
          priority: 'MEDIUM',
          category: 'COMPLETENESS',
          action: '実績データ5件の欠落原因を調査し、次回報告までに改善してください。',
          affectedRecordCount: 5,
          estimatedResolutionTime: 'PT2H',
          targetCompletionDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 0
    });

    jest.spyOn(dataQualityValidation, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(
      Array(95).fill(null).map((_, i) => ({
        productivityDataId: `PROD-${i + 1}`,
        workerId: `WORKER-001`,
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'INTERMEDIATE'
      }))
    );

    jest.spyOn(dataQualityValidation, 'sendQualityValidationResultToFieldLeader' as any).mockResolvedValue({
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: startDate,
      aggregationPeriodEndDate: endDate,
      teamId: teamId,
      fieldLeaderUserId: fieldLeaderUserId,
      userAuthToken: authToken
    });

    expect(result.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');
    expect(result.overallQualityJudgment.qualityScore).toBe(88);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(true);
    expect(result.overallQualityJudgment.judgmentReason).toBeDefined();
    expect(typeof result.overallQualityJudgment.judgmentReason).toBe('string');
  });

  it('改善指示にCOMPLETENESS優先度のアイテムが含まれ、欠落データに関する指示が存在すること', async () => {
    const authToken = 'test-token-12345';
    const fieldLeaderUserId = 'LEADER-001';
    const teamId = 'TEAM-001';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    jest.spyOn(dataQualityValidation, 'assessDataCompleteness' as any).mockReturnValue({
      status: 'WARNING',
      completenessPercentage: 95,
      expectedRecordCount: 100,
      actualRecordCount: 95,
      missingFieldCount: 0,
      details: ['実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。']
    });

    jest.spyOn(dataQualityValidation, 'assessDataAccuracy' as any).mockReturnValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    jest.spyOn(dataQualityValidation, 'detectAnomalousValues' as any).mockReturnValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    jest.spyOn(dataQualityValidation, 'generateQualityJudgment' as any).mockReturnValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性がWARNING状態（95%）です。条件付き承認可能ですが、改善が必要です。',
      qualityScore: 88,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 95,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    jest.spyOn(dataQualityValidation, 'generateImprovementGuidance' as any).mockReturnValue({
      guidanceItems: [
        {
          priority: 'MEDIUM',
          category: 'COMPLETENESS',
          action: '実績データ5件の欠落原因を調査し、次回報告までに改善してください。',
          affectedRecordCount: 5,
          estimatedResolutionTime: 'PT2H',
          targetCompletionDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 0
    });

    jest.spyOn(dataQualityValidation, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(
      Array(95).fill(null).map((_, i) => ({
        productivityDataId: `PROD-${i + 1}`,
        workerId: `WORKER-001`,
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'INTERMEDIATE'
      }))
    );

    jest.spyOn(dataQualityValidation, 'sendQualityValidationResultToFieldLeader' as any).mockResolvedValue({
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: startDate,
      aggregationPeriodEndDate: endDate,
      teamId: teamId,
      fieldLeaderUserId: fieldLeaderUserId,
      userAuthToken: authToken
    });

    expect(result.improvementGuidance.length).toBeGreaterThanOrEqual(1);
    const completenessGuidance = result.improvementGuidance.find(
      (item) => item.category === 'COMPLETENESS'
    );
    expect(completenessGuidance).toBeDefined();
    expect(completenessGuidance?.priority).toBe('MEDIUM');
    expect(completenessGuidance?.affectedRecordCount).toBe(5);
    expect(completenessGuidance?.action).toBeDefined();
    expect(typeof completenessGuidance?.action).toBe('string');
    expect(completenessGuidance?.estimatedResolutionTime).toBe('PT2H');
    expect(completenessGuidance?.targetCompletionDate).toBeDefined();
    expect(typeof completenessGuidance?.targetCompletionDate).toBe('string');
  });

  it('正確性検証がPASSであり、異常値検出もPASSであること', async () => {
    const authToken = 'test-token-12345';
    const fieldLeaderUserId = 'LEADER-001';
    const teamId = 'TEAM-001';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    jest.spyOn(dataQualityValidation, 'assessDataCompleteness' as any).mockReturnValue({
      status: 'WARNING',
      completenessPercentage: 95,
      expectedRecordCount: 100,
      actualRecordCount: 95,
      missingFieldCount: 0,
      details: ['実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。']
    });

    jest.spyOn(dataQualityValidation, 'assessDataAccuracy' as any).mockReturnValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    jest.spyOn(dataQualityValidation, 'detectAnomalousValues' as any).mockReturnValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    jest.spyOn(dataQualityValidation, 'generateQualityJudgment' as any).mockReturnValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性がWARNING状態（95%）です。条件付き承認可能ですが、改善が必要です。',
      qualityScore: 88,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 95,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    jest.spyOn(dataQualityValidation, 'generateImprovementGuidance' as any).mockReturnValue({
      guidanceItems: [
        {
          priority: 'MEDIUM',
          category: 'COMPLETENESS',
          action: '実績データ5件の欠落原因を調査し、次回報告までに改善してください。',
          affectedRecordCount: 5,
          estimatedResolutionTime: 'PT2H',
          targetCompletionDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 0
    });

    jest.spyOn(dataQualityValidation, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(
      Array(95).fill(null).map((_, i) => ({
        productivityDataId: `PROD-${i + 1}`,
        workerId: `WORKER-001`,
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'INTERMEDIATE'
      }))
    );

    jest.spyOn(dataQualityValidation, 'sendQualityValidationResultToFieldLeader' as any).mockResolvedValue({
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: startDate,
      aggregationPeriodEndDate: endDate,
      teamId: teamId,
      fieldLeaderUserId: fieldLeaderUserId,
      userAuthToken: authToken
    });

    expect(result.accuracyAssessment.status).toBe('PASS');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(0);
    expect(result.accuracyAssessment.outOfRangeCount).toBe(0);
    expect(result.anomalyDetection.status).toBe('PASS');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(0);
  });

  it('現場リーダーへの通知が正常に送信されており、配信状態がDELIVEREDであること', async () => {
    const authToken = 'test-token-12345';
    const fieldLeaderUserId = 'LEADER-001';
    const teamId = 'TEAM-001';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    jest.spyOn(dataQualityValidation, 'assessDataCompleteness' as any).mockReturnValue({
      status: 'WARNING',
      completenessPercentage: 95,
      expectedRecordCount: 100,
      actualRecordCount: 95,
      missingFieldCount: 0,
      details: ['実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。']
    });

    jest.spyOn(dataQualityValidation, 'assessDataAccuracy' as any).mockReturnValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    jest.spyOn(dataQualityValidation, 'detectAnomalousValues' as any).mockReturnValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    jest.spyOn(dataQualityValidation, 'generateQualityJudgment' as any).mockReturnValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性がWARNING状態（95%）です。条件付き承認可能ですが、改善が必要です。',
      qualityScore: 88,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 95,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    jest.spyOn(dataQualityValidation, 'generateImprovementGuidance' as any).mockReturnValue({
      guidanceItems: [
        {
          priority: 'MEDIUM',
          category: 'COMPLETENESS',
          action: '実績データ5件の欠落原因を調査し、次回報告までに改善してください。',
          affectedRecordCount: 5,
          estimatedResolutionTime: 'PT2H',
          targetCompletionDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 0
    });

    jest.spyOn(dataQualityValidation, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(
      Array(95).fill(null).map((_, i) => ({
        productivityDataId: `PROD-${i + 1}`,
        workerId: `WORKER-001`,
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'INTERMEDIATE'
      }))
    );

    jest.spyOn(dataQualityValidation, 'sendQualityValidationResultToFieldLeader' as any).mockResolvedValue({
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: startDate,
      aggregationPeriodEndDate: endDate,
      teamId: teamId,
      fieldLeaderUserId: fieldLeaderUserId,
      userAuthToken: authToken
    });

    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe(fieldLeaderUserId);
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
    expect(result.notificationSent.notificationTimestamp).toBeDefined();
  });

  it('出力が必須フィールドをすべて含んでいること', async () => {
    const authToken = 'test-token-12345';
    const fieldLeaderUserId = 'LEADER-001';
    const teamId = 'TEAM-001';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    jest.spyOn(dataQualityValidation, 'assessDataCompleteness' as any).mockReturnValue({
      status: 'WARNING',
      completenessPercentage: 95,
      expectedRecordCount: 100,
      actualRecordCount: 95,
      missingFieldCount: 0,
      details: ['実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。']
    });

    jest.spyOn(dataQualityValidation, 'assessDataAccuracy' as any).mockReturnValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    jest.spyOn(dataQualityValidation, 'detectAnomalousValues' as any).mockReturnValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    jest.spyOn(dataQualityValidation, 'generateQualityJudgment' as any).mockReturnValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性がWARNING状態（95%）です。条件付き承認可能ですが、改善が必要です。',
      qualityScore: 88,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 95,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    jest.spyOn(dataQualityValidation, 'generateImprovementGuidance' as any).mockReturnValue({
      guidanceItems: [
        {
          priority: 'MEDIUM',
          category: 'COMPLETENESS',
          action: '実績データ5件の欠落原因を調査し、次回報告までに改善してください。',
          affectedRecordCount: 5,
          estimatedResolutionTime: 'PT2H',
          targetCompletionDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 0
    });

    jest.spyOn(dataQualityValidation, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(
      Array(95).fill(null).map((_, i) => ({
        productivityDataId: `PROD-${i + 1}`,
        workerId: `WORKER-001`,
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'INTERMEDIATE'
      }))
    );

    jest.spyOn(dataQualityValidation, 'sendQualityValidationResultToFieldLeader' as any).mockResolvedValue({
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: startDate,
      aggregationPeriodEndDate: endDate,
      teamId: teamId,
      fieldLeaderUserId: fieldLeaderUserId,
      userAuthToken: authToken
    });

    expect(result.validationExecutedAt).toBeDefined();
    expect(typeof result.validationExecutedAt).toBe('string');
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe(startDate);
    expect(result.aggregationPeriod.endDate).toBe(endDate);
    expect(result.targetTeamId).toBe(teamId);
    expect(result.totalRecordsProcessed).toBeGreaterThan(0);
    expect(result.completenessAssessment).toBeDefined();
    expect(result.accuracyAssessment).toBeDefined();
    expect(result.anomalyDetection).toBeDefined();
    expect(result.overallQualityJudgment).toBeDefined();
    expect(result.improvementGuidance).toBeDefined();
  });

  it('完全性レベルが90%以上99%未満のとき、totalRecordsProcessedが95件であること', async () => {
    const authToken = 'test-token-12345';
    const fieldLeaderUserId = 'LEADER-001';
    const teamId = 'TEAM-001';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    jest.spyOn(dataQualityValidation, 'assessDataCompleteness' as any).mockReturnValue({
      status: 'WARNING',
      completenessPercentage: 95,
      expectedRecordCount: 100,
      actualRecordCount: 95,
      missingFieldCount: 0,
      details: ['実績件数が期待件数の95%です。カバー率は閾値90%以上99%未満の警告域にあります。']
    });

    jest.spyOn(dataQualityValidation, 'assessDataAccuracy' as any).mockReturnValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    jest.spyOn(dataQualityValidation, 'detectAnomalousValues' as any).mockReturnValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    jest.spyOn(dataQualityValidation, 'generateQualityJudgment' as any).mockReturnValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性がWARNING状態（95%）です。条件付き承認可能ですが、改善が必要です。',
      qualityScore: 88,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 95,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    jest.spyOn(dataQualityValidation, 'generateImprovementGuidance' as any).mockReturnValue({
      guidanceItems: [
        {
          priority: 'MEDIUM',
          category: 'COMPLETENESS',
          action: '実績データ5件の欠落原因を調査し、次回報告までに改善してください。',
          affectedRecordCount: 5,
          estimatedResolutionTime: 'PT2H',
          targetCompletionDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 0
    });

    jest.spyOn(dataQualityValidation, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(
      Array(95).fill(null).map((_, i) => ({
        productivityDataId: `PROD-${i + 1}`,
        workerId: `WORKER-001`,
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'INTERMEDIATE'
      }))
    );

    jest.spyOn(dataQualityValidation, 'sendQualityValidationResultToFieldLeader' as any).mockResolvedValue({
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: startDate,
      aggregationPeriodEndDate: endDate,
      teamId: teamId,
      fieldLeaderUserId: fieldLeaderUserId,
      userAuthToken: authToken
    });

    expect(result.totalRecordsProcessed).toBe(
      result.completenessAssessment.actualRecordCount
    );
    expect(result.completenessAssessment.actualRecordCount).toBe(95);
  });
});