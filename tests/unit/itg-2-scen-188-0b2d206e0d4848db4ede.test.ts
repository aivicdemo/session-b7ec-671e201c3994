import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import type {
  ValidateAggregatedPerformanceDataInput,
  ValidateAggregatedPerformanceDataOutput,
} from '../../src/logic/data-quality-validation';

// Mock individual helper functions
jest.mock('../../src/logic/data-quality-validation', () => {
  const actualModule = jest.requireActual('../../src/logic/data-quality-validation');
  return {
    ...actualModule,
    authenticateUser: jest.fn(),
    authorizeUserAction: jest.fn(),
    findProductivityDataByTeamAndPeriod: jest.fn(),
    findPerformanceRecordsByWorkerIds: jest.fn(),
    assessDataCompleteness: jest.fn(),
    assessDataAccuracy: jest.fn(),
    detectAnomalousValues: jest.fn(),
    generateQualityJudgment: jest.fn(),
    generateImprovementGuidance: jest.fn(),
    sendQualityValidationResultToFieldLeader: jest.fn(),
  };
});

describe('SCEN-188: 日次集約された作業実績データの完全性・正確性・異常値を自動検証', () => {
  let mockAuthenticateUser: jest.Mock;
  let mockAuthorizeUserAction: jest.Mock;
  let mockFindProductivityDataByTeamAndPeriod: jest.Mock;
  let mockFindPerformanceRecordsByWorkerIds: jest.Mock;
  let mockAssessDataCompleteness: jest.Mock;
  let mockAssessDataAccuracy: jest.Mock;
  let mockDetectAnomalousValues: jest.Mock;
  let mockGenerateQualityJudgment: jest.Mock;
  let mockGenerateImprovementGuidance: jest.Mock;
  let mockSendQualityValidationResultToFieldLeader: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Import mocked functions
    const module = require('../../src/logic/data-quality-validation');
    mockAuthenticateUser = module.authenticateUser;
    mockAuthorizeUserAction = module.authorizeUserAction;
    mockFindProductivityDataByTeamAndPeriod = module.findProductivityDataByTeamAndPeriod;
    mockFindPerformanceRecordsByWorkerIds = module.findPerformanceRecordsByWorkerIds;
    mockAssessDataCompleteness = module.assessDataCompleteness;
    mockAssessDataAccuracy = module.assessDataAccuracy;
    mockDetectAnomalousValues = module.detectAnomalousValues;
    mockGenerateQualityJudgment = module.generateQualityJudgment;
    mockGenerateImprovementGuidance = module.generateImprovementGuidance;
    mockSendQualityValidationResultToFieldLeader = module.sendQualityValidationResultToFieldLeader;
  });

  it('正常系：認証と権限確認に成功し、現場リーダーが品質検証を実行して通知が現場リーダーに送信される', async () => {
    // Step 1-3: 認証済みの現場リーダーユーザーと認証トークンを用意
    const fieldLeaderUserId = 'FL-12345';
    const userAuthToken = 'valid_token_xyz';
    const teamId = 'TEAM-001';
    const siteId = 'SITE-001';

    // Step 2: authenticateUser処理をスタブ化し、認証トークンが有効であることを返す
    mockAuthenticateUser.mockResolvedValue({
      isValid: true,
      userId: fieldLeaderUserId,
    });

    // Step 3: authorizeUserAction処理をスタブ化し、当該ユーザーが『現場リーダー』権限を持つことを確認可能な状態にする
    mockAuthorizeUserAction.mockResolvedValue({
      hasPermission: true,
      role: '現場リーダー',
    });

    // Step 4: findProductivityDataByTeamAndPeriod処理で集約データを返す
    const mockProductivityRecords = [
      {
        productivityDataId: 'PROD-001',
        workerId: 'W-001',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 95,
        qualityScore: 90,
        errorCount: 0,
        proficiencyLevel: '高',
      },
      {
        productivityDataId: 'PROD-002',
        workerId: 'W-002',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 98,
        productivityRate: 93,
        qualityScore: 88,
        errorCount: 1,
        proficiencyLevel: '中',
      },
      {
        productivityDataId: 'PROD-003',
        workerId: 'W-003',
        plannedWorkingHours: 8,
        actualWorkingHours: 7.5,
        completedCount: 96,
        productivityRate: 91,
        qualityScore: 87,
        errorCount: 1,
        proficiencyLevel: '中',
      },
      {
        productivityDataId: 'PROD-004',
        workerId: 'W-004',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 102,
        productivityRate: 97,
        qualityScore: 92,
        errorCount: 0,
        proficiencyLevel: '高',
      },
      {
        productivityDataId: 'PROD-005',
        workerId: 'W-005',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 99,
        productivityRate: 94,
        qualityScore: 89,
        errorCount: 0,
        proficiencyLevel: '中',
      },
    ];

    mockFindProductivityDataByTeamAndPeriod.mockResolvedValue(mockProductivityRecords);

    // Step 5: findPerformanceRecordsByWorkerIds処理をスタブ化し、チーム内の作業者ごとの過去実績を返す
    const mockPerformanceHistory = {
      'W-001': [
        { date: '2024-01-01', productivity: 94, quality: 89 },
        { date: '2024-01-02', productivity: 95, quality: 90 },
      ],
      'W-002': [
        { date: '2024-01-01', productivity: 92, quality: 87 },
        { date: '2024-01-02', productivity: 93, quality: 88 },
      ],
      'W-003': [
        { date: '2024-01-01', productivity: 90, quality: 86 },
        { date: '2024-01-02', productivity: 91, quality: 87 },
      ],
      'W-004': [
        { date: '2024-01-01', productivity: 96, quality: 91 },
        { date: '2024-01-02', productivity: 97, quality: 92 },
      ],
      'W-005': [
        { date: '2024-01-01', productivity: 93, quality: 88 },
        { date: '2024-01-02', productivity: 94, quality: 89 },
      ],
    };

    mockFindPerformanceRecordsByWorkerIds.mockResolvedValue(mockPerformanceHistory);

    // Step 6: assessDataCompleteness処理で完全性検証結果を返す
    const mockCompletenessResult = {
      status: 'PASS' as const,
      missingFieldCount: 0,
      expectedRecordCount: 5,
      actualRecordCount: 5,
      completenessPercentage: 100,
      details: [],
    };

    mockAssessDataCompleteness.mockResolvedValue(mockCompletenessResult);

    // Step 7: assessDataAccuracy処理で正確性検証結果を返す
    const mockAccuracyResult = {
      status: 'PASS' as const,
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    };

    mockAssessDataAccuracy.mockResolvedValue(mockAccuracyResult);

    // Step 8: detectAnomalousValues処理で異常値検出結果を返す
    const mockAnomalyResult = {
      status: 'PASS' as const,
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString(),
    };

    mockDetectAnomalousValues.mockResolvedValue(mockAnomalyResult);

    // Step 9: generateQualityJudgment処理で総合品質判定を返す
    const mockQualityJudgment = {
      judgment: 'APPROVED' as const,
      judgmentReason: '全ての検証項目が基準を満たしました',
      qualityScore: 95,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 100,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    };

    mockGenerateQualityJudgment.mockResolvedValue(mockQualityJudgment);

    // Step 10: generateImprovementGuidance処理で改善指示を返す
    const mockGuidanceResult = {
      guidanceItems: [],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 0,
      criticalActionCount: 0,
    };

    mockGenerateImprovementGuidance.mockResolvedValue(mockGuidanceResult);

    // Step 11: sendQualityValidationResultToFieldLeader処理で通知送信結果を返す
    const now = new Date();
    const mockNotificationResult = {
      sent: true,
      recipientUserId: fieldLeaderUserId,
      notificationTimestamp: now.toISOString(),
      deliveryStatus: 'DELIVERED' as const,
    };

    mockSendQualityValidationResultToFieldLeader.mockResolvedValue(mockNotificationResult);

    // Step 12: validateAggregatedPerformanceDataを呼び出す
    const input: ValidateAggregatedPerformanceDataInput = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      siteId: 'SITE-001',
      fieldLeaderUserId,
      userAuthToken,
    };

    const result: ValidateAggregatedPerformanceDataOutput =
      await validateAggregatedPerformanceData(input);

    // Expected result verification based on specification
    // 1. validationExecutedAt: ISO 8601形式の現在日時が返される
    expect(result.validationExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 2. aggregationPeriod: {startDate: '2024-01-01', endDate: '2024-01-31'}
    expect(result.aggregationPeriod).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    // 3. targetTeamId: 'TEAM-001'
    expect(result.targetTeamId).toBe('TEAM-001');

    // 4. totalRecordsProcessed: スタブから返された実績記録の総件数(5件以上)
    expect(result.totalRecordsProcessed).toBeGreaterThanOrEqual(5);
    expect(result.totalRecordsProcessed).toBe(5);

    // 5. completenessAssessment: {status: 'PASS', missingFieldCount: 0, expectedRecordCount: (実績件数と一致), actualRecordCount: (実績件数と一致), completenessPercentage: 100, details: []}
    expect(result.completenessAssessment.status).toBe('PASS');
    expect(result.completenessAssessment.missingFieldCount).toBe(0);
    expect(result.completenessAssessment.expectedRecordCount).toBe(5);
    expect(result.completenessAssessment.actualRecordCount).toBe(5);
    expect(result.completenessAssessment.completenessPercentage).toBe(100);
    expect(result.completenessAssessment.details).toEqual([]);

    // 6. accuracyAssessment: {status: 'PASS', inconsistencyCount: 0, outOfRangeCount: 0, details: []}
    expect(result.accuracyAssessment.status).toBe('PASS');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(0);
    expect(result.accuracyAssessment.outOfRangeCount).toBe(0);
    expect(result.accuracyAssessment.details).toEqual([]);

    // 7. anomalyDetection: {status: 'PASS', anomalousRecordCount: 0, anomalies: []}
    expect(result.anomalyDetection.status).toBe('PASS');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(0);
    expect(result.anomalyDetection.anomalies).toEqual([]);

    // 8. overallQualityJudgment: {judgment: 'APPROVED', judgmentReason: '全ての検証項目が基準を満たしました', qualityScore: 95, approvalEligibility: true}
    expect(result.overallQualityJudgment.judgment).toBe('APPROVED');
    expect(result.overallQualityJudgment.judgmentReason).toBe('全ての検証項目が基準を満たしました');
    expect(result.overallQualityJudgment.qualityScore).toBe(95);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(true);

    // 9. improvementGuidance: [] (空配列。検証がすべてPASSのため改善指示なし)
    expect(result.improvementGuidance).toEqual([]);

    // 10. notificationSent: {sent: true, recipientUserId: 'FL-12345', notificationTimestamp: ISO 8601形式の日時, deliveryStatus: 'DELIVERED'}
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('FL-12345');
    expect(result.notificationSent.notificationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
  });
});