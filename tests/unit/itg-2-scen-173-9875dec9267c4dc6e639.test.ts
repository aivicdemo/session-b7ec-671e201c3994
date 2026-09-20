import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

jest.mock('../../src/logic/data-quality-validation', () => {
  const actual = jest.requireActual('../../src/logic/data-quality-validation');
  return {
    ...actual,
    authenticateUser: jest.fn(),
    authorizeUserAction: jest.fn(),
    findProductivityDataByTeamAndPeriod: jest.fn(),
    assessDataCompleteness: jest.fn(),
    assessDataAccuracy: jest.fn(),
    detectAnomalousValues: jest.fn(),
    generateQualityJudgment: jest.fn(),
    generateImprovementGuidance: jest.fn(),
    findPerformanceRecordsByWorkerIds: jest.fn(),
    sendQualityValidationResultToFieldLeader: jest.fn(),
  };
});

describe('SCEN-173: validateAggregatedPerformanceData正常系', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // authenticateUser のスタブ設定
    (dataQualityValidation.authenticateUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId: 'FIELD-LEADER-001',
    });

    // authorizeUserAction のスタブ設定
    (dataQualityValidation.authorizeUserAction as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      role: 'field_leader',
    });

    // findProductivityDataByTeamAndPeriod のスタブ設定
    const productivityData = [];
    for (let day = 1; day <= 7; day++) {
      const dateStr = `2024-01-${String(day).padStart(2, '0')}`;
      for (let worker = 1; worker <= 5; worker++) {
        productivityData.push({
          productivityDataId: `PROD-${day}-${worker}`,
          workerId: `WORKER-${String(worker).padStart(3, '0')}`,
          plannedWorkingHours: 8,
          actualWorkingHours: 8,
          completedCount: 100 + (worker * 10),
          productivityRate: 95 + (worker % 3),
          qualityScore: 90 + (worker % 4),
          errorCount: 1 + (worker % 2),
          proficiencyLevel: 'intermediate',
        });
      }
    }
    (dataQualityValidation.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      productivityData
    );

    // assessDataCompleteness のスタブ設定
    (dataQualityValidation.assessDataCompleteness as jest.Mock).mockResolvedValue({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 35,
      actualRecordCount: 35,
      completenessPercentage: 100,
      details: [],
    });

    // assessDataAccuracy のスタブ設定
    (dataQualityValidation.assessDataAccuracy as jest.Mock).mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    // detectAnomalousValues のスタブ設定
    (dataQualityValidation.detectAnomalousValues as jest.Mock).mockResolvedValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: '2024-01-08T10:00:00Z',
    });

    // generateQualityJudgment のスタブ設定
    (dataQualityValidation.generateQualityJudgment as jest.Mock).mockResolvedValue({
      judgment: 'APPROVED',
      judgmentReason: '全検証項目が合格し、データ品質が十分です',
      qualityScore: 95,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 100,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    });

    // generateImprovementGuidance のスタブ設定
    (dataQualityValidation.generateImprovementGuidance as jest.Mock).mockResolvedValue({
      guidanceItems: [],
      generatedAt: '2024-01-08T10:00:00Z',
      totalGuidanceCount: 0,
      criticalActionCount: 0,
    });

    // findPerformanceRecordsByWorkerIds のスタブ設定
    (dataQualityValidation.findPerformanceRecordsByWorkerIds as jest.Mock).mockResolvedValue([
      {
        workerId: 'WORKER-001',
        historicalRecords: [],
      },
      {
        workerId: 'WORKER-002',
        historicalRecords: [],
      },
      {
        workerId: 'WORKER-003',
        historicalRecords: [],
      },
      {
        workerId: 'WORKER-004',
        historicalRecords: [],
      },
      {
        workerId: 'WORKER-005',
        historicalRecords: [],
      },
    ]);

    // sendQualityValidationResultToFieldLeader のスタブ設定
    (dataQualityValidation.sendQualityValidationResultToFieldLeader as jest.Mock).mockResolvedValue({
      sent: true,
      recipientUserId: 'FIELD-LEADER-001',
      notificationTimestamp: '2024-01-08T10:00:00Z',
      deliveryStatus: 'DELIVERED',
    });
  });

  it('集約期間内の完全で正確なデータが存在し、異常値がなく、全検証が合格して品質判定が承認される', async () => {
    // 入力値を準備
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-07',
      teamId: 'TEAM-001',
      siteId: 'SITE-001',
      fieldLeaderUserId: 'FIELD-LEADER-001',
      userAuthToken: 'valid-auth-token-12345',
    };

    // 公開処理を呼び出す
    const result = await validateAggregatedPerformanceData(input);

    // completenessAssessment の検証
    expect(result.completenessAssessment.status).toBe('PASS');
    expect(result.completenessAssessment.missingFieldCount).toBe(0);
    expect(result.completenessAssessment.expectedRecordCount).toBe(35);
    expect(result.completenessAssessment.actualRecordCount).toBe(35);
    expect(result.completenessAssessment.completenessPercentage).toBe(100);
    expect(result.completenessAssessment.details).toEqual([]);

    // accuracyAssessment の検証
    expect(result.accuracyAssessment.status).toBe('PASS');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(0);
    expect(result.accuracyAssessment.outOfRangeCount).toBe(0);
    expect(result.accuracyAssessment.details).toEqual([]);

    // anomalyDetection の検証
    expect(result.anomalyDetection.status).toBe('PASS');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(0);
    expect(result.anomalyDetection.anomalies).toEqual([]);

    // overallQualityJudgment の検証
    expect(result.overallQualityJudgment.judgment).toBe('APPROVED');
    expect(result.overallQualityJudgment.qualityScore).toBe(95);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(true);
    expect(result.overallQualityJudgment.judgmentReason).toBe('全検証項目が合格し、データ品質が十分です');

    // improvementGuidance の検証
    expect(result.improvementGuidance).toEqual([]);

    // notificationSent の検証
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('FIELD-LEADER-001');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');

    // aggregationPeriod の検証
    expect(result.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-07');

    // targetTeamId の検証
    expect(result.targetTeamId).toBe('TEAM-001');

    // totalRecordsProcessed の検証
    expect(result.totalRecordsProcessed).toBe(35);

    // validationExecutedAt の検証（ISO 8601形式）
    expect(result.validationExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(() => new Date(result.validationExecutedAt)).not.toThrow();
  });
});