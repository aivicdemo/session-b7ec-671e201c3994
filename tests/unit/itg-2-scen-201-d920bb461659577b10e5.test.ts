import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as persistenceLayer from '../../src/persistence/persistence-layer';
import * as authModule from '../../src/auth/auth-service';
import * as completenessModule from '../../src/logic/data-quality-validation';
import * as accuracyModule from '../../src/logic/data-quality-validation';
import * as anomalyModule from '../../src/logic/data-quality-validation';
import * as judgmentModule from '../../src/logic/data-quality-validation';
import * as guidanceModule from '../../src/logic/data-quality-validation';
import * as notificationModule from '../../src/notification/notification-service';

jest.mock('../../src/persistence/persistence-layer');
jest.mock('../../src/auth/auth-service');
jest.mock('../../src/notification/notification-service');

describe('SCEN-201: 正常系：現場リーダーへの通知送信が試みられ、送信状況（PENDING、DELIVERED、FAILED）が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification to field leader with DELIVERED status', async () => {
    // テストデータ：チームID 'TEAM-001'、期間 '2024-01-01' ～ '2024-01-31' のデータを10件以上用意
    const mockAggregatedRecords = Array.from({ length: 10 }, (_, i) => ({
      productivityDataId: `DATA-${i + 1}`,
      workerId: `WORKER-${i + 1}`,
      plannedWorkingHours: 8,
      actualWorkingHours: 8,
      completedCount: 100 + i,
      productivityRate: 100,
      qualityScore: 95 + (i % 5),
      errorCount: 0,
      proficiencyLevel: 'intermediate',
    }));

    // モック化されたデータベース層に生産性データを格納
    (persistenceLayer.getAggregatedProductivityData as jest.Mock).mockResolvedValue(
      mockAggregatedRecords
    );

    // 認証・認可スタブ：現場リーダーユーザーID 'LEADER-001' が品質確認権限を持つ
    (authModule.verifyUserAuthorization as jest.Mock).mockResolvedValue({
      userId: 'LEADER-001',
      hasPermission: true,
      role: 'field_leader',
    });

    // データ完全性検証スタブ
    const mockCompletenessResult = {
      status: 'PASS' as const,
      missingFieldCount: 0,
      expectedRecordCount: 10,
      actualRecordCount: 10,
      completenessPercentage: 100,
      details: [],
    };
    (completenessModule.assessDataCompleteness as jest.Mock).mockResolvedValue(
      mockCompletenessResult
    );

    // データ正確性検証スタブ
    const mockAccuracyResult = {
      status: 'PASS' as const,
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    };
    (accuracyModule.assessDataAccuracy as jest.Mock).mockResolvedValue(
      mockAccuracyResult
    );

    // 異常値検出スタブ
    const mockAnomalyResult = {
      status: 'PASS' as const,
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: '2024-01-31T15:30:00Z',
    };
    (anomalyModule.detectAnomalousValues as jest.Mock).mockResolvedValue(
      mockAnomalyResult
    );

    // 品質判定スタブ
    const mockJudgmentResult = {
      judgment: 'APPROVED' as const,
      judgmentReason: 'すべての検証項目で基準を満たしています',
      qualityScore: 95,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 100,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    };
    (judgmentModule.generateQualityJudgment as jest.Mock).mockResolvedValue(
      mockJudgmentResult
    );

    // 改善指示生成スタブ：空の配列を返す
    const mockGuidanceResult = {
      guidanceItems: [],
      generatedAt: '2024-01-31T15:30:00Z',
      totalGuidanceCount: 0,
      criticalActionCount: 0,
    };
    (guidanceModule.generateImprovementGuidance as jest.Mock).mockResolvedValue(
      mockGuidanceResult
    );

    // 通知送信スタブ：送信成功時のレスポンス
    const mockNotificationResponse = {
      sent: true,
      recipientUserId: 'LEADER-001',
      notificationTimestamp: '2024-01-31T15:30:00Z',
      deliveryStatus: 'DELIVERED' as const,
    };
    (notificationModule.sendQualityValidationResultToFieldLeader as jest.Mock).mockResolvedValue(
      mockNotificationResponse
    );

    // 関数を呼び出す
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      siteId: undefined,
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token-xyz',
    };

    const result = await validateAggregatedPerformanceData(input);

    // 検証：notificationSentフィールドの内容
    expect(result.notificationSent).toBeDefined();
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('LEADER-001');
    expect(result.notificationSent.notificationTimestamp).toBe('2024-01-31T15:30:00Z');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');

    // 検証：sendQualityValidationResultToFieldLeaderが正確に1回呼び出されたことを確認
    expect(notificationModule.sendQualityValidationResultToFieldLeader).toHaveBeenCalledTimes(1);
    expect(notificationModule.sendQualityValidationResultToFieldLeader).toHaveBeenCalledWith(
      expect.objectContaining({
        validationExecutedAt: expect.any(String),
        aggregationPeriod: expect.any(Object),
        targetTeamId: 'TEAM-001',
        totalRecordsProcessed: expect.any(Number),
        completenessAssessment: expect.any(Object),
        accuracyAssessment: expect.any(Object),
        anomalyDetection: expect.any(Object),
        overallQualityJudgment: expect.any(Object),
        improvementGuidance: expect.any(Array),
      }),
      'LEADER-001'
    );
  });
});