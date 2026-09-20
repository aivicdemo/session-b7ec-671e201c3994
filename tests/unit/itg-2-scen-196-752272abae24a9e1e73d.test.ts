import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

jest.mock('../../src/logic/data-quality-validation', () => ({
  ...jest.requireActual('../../src/logic/data-quality-validation'),
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
}));

describe('SCEN-196: 日次集約された作業実績データの完全性・正確性・異常値を自動検証し、品質判定結果と改善指示を生成して現場リーダーに提示する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // スタブ処理を設定：authenticateUser()はユーザーを認証済みで返す
    (dataQualityValidation.authenticateUser as jest.Mock).mockResolvedValue({
      userId: 'USER-FL-001',
      role: 'fieldLeader',
      authenticated: true,
    });

    // スタブ処理を設定：authorizeUserAction()は現場リーダー権限を許可する
    (dataQualityValidation.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
      permission: 'VALIDATE_DATA',
    });

    // スタブ処理を設定：findProductivityDataByTeamAndPeriod()は集約期間内の50件の有効な実績レコードを返す
    const mockProductivityRecords = Array.from({ length: 50 }, (_, i) => ({
      productivityDataId: `PROD-${i + 1}`,
      workerId: `WORKER-${(i % 10) + 1}`,
      plannedWorkingHours: 8,
      actualWorkingHours: 8,
      completedCount: 100 + i,
      productivityRate: 95 + (i % 5),
      qualityScore: 90 + (i % 10),
      errorCount: i % 3,
      proficiencyLevel: 'INTERMEDIATE',
    }));
    (dataQualityValidation.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      mockProductivityRecords
    );

    // スタブ処理を設定：findPerformanceRecordsByWorkerIds()は各作業者の過去実績を返す
    (dataQualityValidation.findPerformanceRecordsByWorkerIds as jest.Mock).mockResolvedValue([
      {
        workerId: 'WORKER-1',
        historicalAverage: 95,
        standardDeviation: 2,
      },
    ]);

    // スタブ処理を設定：assessDataCompleteness()は完全性を'PASS'で返す
    (dataQualityValidation.assessDataCompleteness as jest.Mock).mockResolvedValue({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 50,
      actualRecordCount: 50,
      completenessPercentage: 100,
      details: [],
    });

    // スタブ処理を設定：assessDataAccuracy()は正確性を'PASS'で返す
    (dataQualityValidation.assessDataAccuracy as jest.Mock).mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    // スタブ処理を設定：detectAnomalousValues()は異常値を検出しない
    (dataQualityValidation.detectAnomalousValues as jest.Mock).mockResolvedValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString(),
    });

    // スタブ処理を設定：generateQualityJudgment()は品質判定を'APPROVED'で返す
    (dataQualityValidation.generateQualityJudgment as jest.Mock).mockResolvedValue({
      judgment: 'APPROVED',
      judgmentReason: 'すべての検証が合格しました',
      qualityScore: 95,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 100,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    });

    // スタブ処理を設定：generateImprovementGuidance()は改善指示を空配列で返す
    (dataQualityValidation.generateImprovementGuidance as jest.Mock).mockResolvedValue([]);

    // スタブ処理を設定：sendQualityValidationResultToFieldLeader()は通知送信を'DELIVERED'で返す
    (dataQualityValidation.sendQualityValidationResultToFieldLeader as jest.Mock).mockResolvedValue({
      sent: true,
      recipientUserId: 'USER-FL-001',
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
    });
  });

  it('正常系：検証実行日時、集約期間、対象チームID、処理レコード総件数を含む出力が ISO 8601 形式で正確に返される', async () => {
    // テスト用の正常系入力データを準備する
    const input = {
      aggregationPeriodStartDate: '2024-01-15',
      aggregationPeriodEndDate: '2024-01-15',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'USER-FL-001',
      userAuthToken: 'valid-token-xxx',
    };

    // validateAggregatedPerformanceData()を呼び出す：準備した入力データを渡す
    const result = await validateAggregatedPerformanceData(input);

    // validationExecutedAtがISO 8601形式で返されていることを検証
    expect(result.validationExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    // ISO 8601形式をパースして時刻が妥当な範囲内であることを確認
    const executedAt = new Date(result.validationExecutedAt);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - executedAt.getTime());
    expect(timeDiff).toBeLessThan(10000); // 10秒以内

    // aggregationPeriodが正確に返されていることを検証
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe('2024-01-15');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-15');

    // targetTeamIdが'TEAM-001'であることを検証
    expect(result.targetTeamId).toBe('TEAM-001');

    // totalRecordsProcessedが50であることを検証
    expect(typeof result.totalRecordsProcessed).toBe('number');
    expect(result.totalRecordsProcessed).toBe(50);

    // completenessAssessmentの構造と型を検証
    expect(result.completenessAssessment).toBeDefined();
    expect(['PASS', 'FAIL', 'WARNING']).toContain(result.completenessAssessment.status);
    expect(typeof result.completenessAssessment.missingFieldCount).toBe('number');
    expect(typeof result.completenessAssessment.expectedRecordCount).toBe('number');
    expect(typeof result.completenessAssessment.actualRecordCount).toBe('number');
    expect(typeof result.completenessAssessment.completenessPercentage).toBe('number');
    expect(result.completenessAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(result.completenessAssessment.completenessPercentage).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.completenessAssessment.details)).toBe(true);
    result.completenessAssessment.details.forEach((detail) => {
      expect(typeof detail).toBe('string');
    });

    // accuracyAssessmentの構造と型を検証
    expect(result.accuracyAssessment).toBeDefined();
    expect(['PASS', 'FAIL', 'WARNING']).toContain(result.accuracyAssessment.status);
    expect(typeof result.accuracyAssessment.inconsistencyCount).toBe('number');
    expect(typeof result.accuracyAssessment.outOfRangeCount).toBe('number');
    expect(Array.isArray(result.accuracyAssessment.details)).toBe(true);
    result.accuracyAssessment.details.forEach((detail) => {
      expect(typeof detail.recordId).toBe('string');
      expect(typeof detail.field).toBe('string');
      expect(typeof detail.issue).toBe('string');
      expect(typeof detail.actualValue).toBe('string');
    });

    // anomalyDetectionの構造と型を検証
    expect(result.anomalyDetection).toBeDefined();
    expect(['PASS', 'DETECTED']).toContain(result.anomalyDetection.status);
    expect(typeof result.anomalyDetection.anomalousRecordCount).toBe('number');
    expect(Array.isArray(result.anomalyDetection.anomalies)).toBe(true);
    result.anomalyDetection.anomalies.forEach((anomaly) => {
      expect(typeof anomaly.recordId).toBe('string');
      expect(typeof anomaly.workerId).toBe('string');
      expect(typeof anomaly.field).toBe('string');
      expect(['STATISTICAL_OUTLIER', 'BUSINESS_RULE_VIOLATION']).toContain(anomaly.anomalyType);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(anomaly.severity);
      expect(typeof anomaly.currentValue).toBe('number');
      expect(typeof anomaly.recommendedAction).toBe('string');
    });

    // overallQualityJudgmentの構造と型を検証
    expect(result.overallQualityJudgment).toBeDefined();
    expect(['APPROVED', 'CONDITIONAL_APPROVAL', 'REJECTED']).toContain(
      result.overallQualityJudgment.judgment
    );
    expect(typeof result.overallQualityJudgment.judgmentReason).toBe('string');
    expect(typeof result.overallQualityJudgment.qualityScore).toBe('number');
    expect(result.overallQualityJudgment.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.overallQualityJudgment.qualityScore).toBeLessThanOrEqual(100);
    expect(typeof result.overallQualityJudgment.approvalEligibility).toBe('boolean');
    expect(result.overallQualityJudgment.componentScores).toBeDefined();
    expect(typeof result.overallQualityJudgment.componentScores.completenessScore).toBe('number');
    expect(typeof result.overallQualityJudgment.componentScores.accuracyScore).toBe('number');
    expect(typeof result.overallQualityJudgment.componentScores.anomalyScore).toBe('number');

    // improvementGuidanceの構造と型を検証
    expect(Array.isArray(result.improvementGuidance)).toBe(true);
    result.improvementGuidance.forEach((guidance) => {
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(guidance.priority);
      expect(['COMPLETENESS', 'ACCURACY', 'ANOMALY']).toContain(guidance.category);
      expect(typeof guidance.action).toBe('string');
      expect(typeof guidance.affectedRecordCount).toBe('number');
      expect(typeof guidance.estimatedResolutionTime).toBe('string');
      expect(typeof guidance.targetCompletionDate).toBe('string');
    });

    // notificationSentの構造と型を検証
    expect(result.notificationSent).toBeDefined();
    expect(typeof result.notificationSent.sent).toBe('boolean');
    expect(typeof result.notificationSent.recipientUserId).toBe('string');
    expect(result.notificationSent.recipientUserId).toBe('USER-FL-001');
    expect(typeof result.notificationSent.notificationTimestamp).toBe('string');
    expect(result.notificationSent.notificationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );
    expect(['PENDING', 'DELIVERED', 'FAILED']).toContain(result.notificationSent.deliveryStatus);
  });
});