import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

jest.mock('../../src/logic/data-quality-validation', () => ({
  ...jest.requireActual('../../src/logic/data-quality-validation'),
}));

describe('SCEN-191: Data Quality Validation - Completeness Failure Case', () => {
  let authenticateUserStub: jest.Mock;
  let authorizeUserActionStub: jest.Mock;
  let findProductivityDataByTeamAndPeriodStub: jest.Mock;
  let findPerformanceRecordsByWorkerIdsStub: jest.Mock;
  let assessDataCompletenessStub: jest.Mock;
  let assessDataAccuracyStub: jest.Mock;
  let detectAnomalousValuesStub: jest.Mock;
  let generateQualityJudgmentStub: jest.Mock;
  let generateImprovementGuidanceStub: jest.Mock;
  let sendQualityValidationResultToFieldLeaderStub: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    authenticateUserStub = jest.fn().mockResolvedValue({ authenticated: true });
    authorizeUserActionStub = jest.fn().mockResolvedValue({ authorized: true, role: 'FIELD_LEADER' });
    
    const mockProductivityData = Array(100).fill(null).map((_, i) => ({
      productivityDataId: `PROD-${i}`,
      workerId: `WORKER-${i % 10}`,
      plannedWorkingHours: 8,
      actualWorkingHours: 8,
      completedCount: 100,
      productivityRate: 95,
      qualityScore: 90,
      errorCount: 2,
      proficiencyLevel: 'INTERMEDIATE',
    }));
    
    findProductivityDataByTeamAndPeriodStub = jest.fn().mockResolvedValue(mockProductivityData);
    findPerformanceRecordsByWorkerIdsStub = jest.fn().mockResolvedValue(mockProductivityData);

    assessDataCompletenessStub = jest.fn().mockResolvedValue({
      status: 'FAIL',
      missingFieldCount: 0,
      expectedRecordCount: 200,
      actualRecordCount: 100,
      completenessPercentage: 50.0,
      details: ['実績件数が期待件数の50%です'],
    });

    assessDataAccuracyStub = jest.fn().mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    detectAnomalousValuesStub = jest.fn().mockResolvedValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString(),
    });

    generateQualityJudgmentStub = jest.fn().mockResolvedValue({
      judgment: 'REJECTED',
      judgmentReason: 'データ完全性が不足しています。実績件数が期待件数の90%未満（50%）です。',
      qualityScore: 45,
      approvalEligibility: false,
      componentScores: {
        completenessScore: 50,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    });

    const now = new Date().toISOString();
    generateImprovementGuidanceStub = jest.fn().mockResolvedValue({
      guidanceItems: [
        {
          priority: 'CRITICAL',
          category: 'COMPLETENESS',
          action: '実績データの欠落を改善し、期待件数の90%以上（180件以上）のデータ収集を実施してください',
          affectedRecordCount: 100,
          estimatedResolutionTime: '1営業日',
          targetCompletionDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        },
      ],
      generatedAt: now,
      totalGuidanceCount: 1,
      criticalActionCount: 1,
    });

    sendQualityValidationResultToFieldLeaderStub = jest.fn().mockResolvedValue({
      sent: true,
      recipientUserId: 'LEADER-001',
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
    });

    (dataQualityValidation as any).authenticateUser = authenticateUserStub;
    (dataQualityValidation as any).authorizeUserAction = authorizeUserActionStub;
    (dataQualityValidation as any).findProductivityDataByTeamAndPeriod = findProductivityDataByTeamAndPeriodStub;
    (dataQualityValidation as any).findPerformanceRecordsByWorkerIds = findPerformanceRecordsByWorkerIdsStub;
    (dataQualityValidation as any).assessDataCompleteness = assessDataCompletenessStub;
    (dataQualityValidation as any).assessDataAccuracy = assessDataAccuracyStub;
    (dataQualityValidation as any).detectAnomalousValues = detectAnomalousValuesStub;
    (dataQualityValidation as any).generateQualityJudgment = generateQualityJudgmentStub;
    (dataQualityValidation as any).generateImprovementGuidance = generateImprovementGuidanceStub;
    (dataQualityValidation as any).sendQualityValidationResultToFieldLeader = sendQualityValidationResultToFieldLeaderStub;
  });

  it('should return FAIL status for completeness when actual records are less than 90% of expected records', async () => {
    const input = {
      aggregationPeriodStartDate: '2025-01-01',
      aggregationPeriodEndDate: '2025-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token-xyz',
    };

    const result = await validateAggregatedPerformanceData(input);

    expect(result.completenessAssessment.status).toBe('FAIL');
    expect(result.completenessAssessment.completenessPercentage).toBe(50.0);
    expect(result.completenessAssessment.actualRecordCount).toBe(100);
    expect(result.completenessAssessment.expectedRecordCount).toBe(200);
  });

  it('should set overall quality judgment to REJECTED with appropriate quality score', async () => {
    const input = {
      aggregationPeriodStartDate: '2025-01-01',
      aggregationPeriodEndDate: '2025-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token-xyz',
    };

    const result = await validateAggregatedPerformanceData(input);

    expect(result.overallQualityJudgment.judgment).toBe('REJECTED');
    expect(result.overallQualityJudgment.qualityScore).toBe(45);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(false);
    expect(result.overallQualityJudgment.judgmentReason).toContain('データ完全性が不足しています');
    expect(result.overallQualityJudgment.judgmentReason).toContain('実績件数が期待件数の90%未満（50%）');
  });

  it('should include CRITICAL priority improvement guidance for completeness issues', async () => {
    const input = {
      aggregationPeriodStartDate: '2025-01-01',
      aggregationPeriodEndDate: '2025-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token-xyz',
    };

    const result = await validateAggregatedPerformanceData(input);

    const completenessGuidance = result.improvementGuidance.find(
      (g) => g.priority === 'CRITICAL' && g.category === 'COMPLETENESS'
    );

    expect(completenessGuidance).toBeDefined();
    expect(completenessGuidance?.action).toContain('期待件数の90%以上（180件以上）のデータ収集を実施してください');
    expect(completenessGuidance?.affectedRecordCount).toBe(100);
    expect(completenessGuidance?.estimatedResolutionTime).toBe('1営業日');
  });

  it('should send notification to field leader with DELIVERED status', async () => {
    const input = {
      aggregationPeriodStartDate: '2025-01-01',
      aggregationPeriodEndDate: '2025-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token-xyz',
    };

    const result = await validateAggregatedPerformanceData(input);

    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('LEADER-001');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
    expect(result.notificationSent.notificationTimestamp).toBeTruthy();
  });

  it('should populate all required output fields', async () => {
    const input = {
      aggregationPeriodStartDate: '2025-01-01',
      aggregationPeriodEndDate: '2025-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token-xyz',
    };

    const result = await validateAggregatedPerformanceData(input);

    expect(result).toHaveProperty('validationExecutedAt');
    expect(result).toHaveProperty('aggregationPeriod');
    expect(result).toHaveProperty('targetTeamId');
    expect(result).toHaveProperty('totalRecordsProcessed');
    expect(result).toHaveProperty('completenessAssessment');
    expect(result).toHaveProperty('accuracyAssessment');
    expect(result).toHaveProperty('anomalyDetection');
    expect(result).toHaveProperty('overallQualityJudgment');
    expect(result).toHaveProperty('improvementGuidance');
    expect(result).toHaveProperty('notificationSent');

    expect(result.aggregationPeriod.startDate).toBe('2025-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2025-01-31');
    expect(result.targetTeamId).toBe('TEAM-001');
    expect(result.totalRecordsProcessed).toBe(100);
  });
});