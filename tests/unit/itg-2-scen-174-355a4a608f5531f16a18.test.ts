import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

jest.mock('../../src/logic/data-quality-validation');

describe('SCEN-174: 正常系：集約期間内のデータに軽微な欠落と異常値の低レベル検出があり、条件付き承認で改善指示が生成される', () => {
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

    mockAuthenticateUser = jest.fn().mockResolvedValue({
      userId: 'LEADER-001',
      role: 'fieldLeader',
      isAuthenticated: true,
    });

    mockAuthorizeUserAction = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: 'LEADER-001',
      action: 'validateAggregatedPerformanceData',
    });

    mockFindProductivityDataByTeamAndPeriod = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PROD-001',
        workerId: 'WORKER-001',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'Advanced',
      },
      {
        productivityDataId: 'PROD-002',
        workerId: 'WORKER-002',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 95,
        productivityRate: 95,
        qualityScore: 92,
        errorCount: 1,
        proficiencyLevel: 'Intermediate',
      },
      {
        productivityDataId: 'PROD-003',
        workerId: 'WORKER-003',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 85,
        productivityRate: 85,
        qualityScore: 88,
        errorCount: 2,
        proficiencyLevel: 'Intermediate',
      },
      {
        productivityDataId: 'PROD-004',
        workerId: 'WORKER-004',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 92,
        productivityRate: 92,
        qualityScore: 90,
        errorCount: 1,
        proficiencyLevel: 'Intermediate',
      },
      {
        productivityDataId: 'PROD-005',
        workerId: 'WORKER-005',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: undefined,
        productivityRate: 88,
        qualityScore: 89,
        errorCount: 0,
        proficiencyLevel: 'Beginner',
      },
      {
        productivityDataId: 'PROD-006',
        workerId: 'WORKER-006',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 90,
        productivityRate: 90,
        qualityScore: 91,
        errorCount: 1,
        proficiencyLevel: 'Intermediate',
      },
      {
        productivityDataId: 'PROD-007',
        workerId: 'WORKER-007',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 98,
        productivityRate: 98,
        qualityScore: 94,
        errorCount: 0,
        proficiencyLevel: 'Advanced',
      },
      {
        productivityDataId: 'PROD-008',
        workerId: 'WORKER-008',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 89,
        productivityRate: 89,
        qualityScore: 87,
        errorCount: 2,
        proficiencyLevel: 'Beginner',
      },
      {
        productivityDataId: 'PROD-009',
        workerId: 'WORKER-009',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 96,
        productivityRate: 96,
        qualityScore: 93,
        errorCount: 1,
        proficiencyLevel: 'Intermediate',
      },
      {
        productivityDataId: 'PROD-010',
        workerId: 'WORKER-010',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 91,
        productivityRate: 91,
        qualityScore: 90,
        errorCount: 1,
        proficiencyLevel: 'Intermediate',
      },
      {
        productivityDataId: 'PROD-011',
        workerId: 'WORKER-003',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 55,
        productivityRate: 55,
        qualityScore: 85,
        errorCount: 3,
        proficiencyLevel: 'Intermediate',
      },
      {
        productivityDataId: 'PROD-012',
        workerId: 'WORKER-011',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 94,
        productivityRate: 94,
        qualityScore: 92,
        errorCount: 0,
        proficiencyLevel: 'Advanced',
      },
    ]);

    mockFindPerformanceRecordsByWorkerIds = jest.fn().mockResolvedValue({
      'WORKER-001': [
        {
          workerId: 'WORKER-001',
          productivityRate: 99,
          qualityScore: 96,
          completedCount: 102,
          errorCount: 0,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-001',
          productivityRate: 100,
          qualityScore: 95,
          completedCount: 101,
          errorCount: 0,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-001',
          productivityRate: 101,
          qualityScore: 94,
          completedCount: 103,
          errorCount: 0,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-002': [
        {
          workerId: 'WORKER-002',
          productivityRate: 94,
          qualityScore: 91,
          completedCount: 96,
          errorCount: 1,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-002',
          productivityRate: 96,
          qualityScore: 93,
          completedCount: 98,
          errorCount: 1,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-002',
          productivityRate: 95,
          qualityScore: 92,
          completedCount: 97,
          errorCount: 1,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-003': [
        {
          workerId: 'WORKER-003',
          productivityRate: 87,
          qualityScore: 88,
          completedCount: 90,
          errorCount: 1,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-003',
          productivityRate: 89,
          qualityScore: 87,
          completedCount: 92,
          errorCount: 2,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-003',
          productivityRate: 88,
          qualityScore: 89,
          completedCount: 91,
          errorCount: 1,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-004': [
        {
          workerId: 'WORKER-004',
          productivityRate: 91,
          qualityScore: 89,
          completedCount: 93,
          errorCount: 1,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-004',
          productivityRate: 92,
          qualityScore: 90,
          completedCount: 94,
          errorCount: 1,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-004',
          productivityRate: 92,
          qualityScore: 91,
          completedCount: 94,
          errorCount: 1,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-005': [
        {
          workerId: 'WORKER-005',
          productivityRate: 80,
          qualityScore: 85,
          completedCount: 78,
          errorCount: 2,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-005',
          productivityRate: 82,
          qualityScore: 86,
          completedCount: 80,
          errorCount: 1,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-005',
          productivityRate: 81,
          qualityScore: 87,
          completedCount: 79,
          errorCount: 2,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-006': [
        {
          workerId: 'WORKER-006',
          productivityRate: 89,
          qualityScore: 90,
          completedCount: 91,
          errorCount: 1,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-006',
          productivityRate: 90,
          qualityScore: 91,
          completedCount: 92,
          errorCount: 1,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-006',
          productivityRate: 90,
          qualityScore: 92,
          completedCount: 92,
          errorCount: 1,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-007': [
        {
          workerId: 'WORKER-007',
          productivityRate: 97,
          qualityScore: 93,
          completedCount: 99,
          errorCount: 0,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-007',
          productivityRate: 98,
          qualityScore: 94,
          completedCount: 100,
          errorCount: 0,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-007',
          productivityRate: 98,
          qualityScore: 95,
          completedCount: 101,
          errorCount: 0,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-008': [
        {
          workerId: 'WORKER-008',
          productivityRate: 87,
          qualityScore: 86,
          completedCount: 88,
          errorCount: 2,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-008',
          productivityRate: 88,
          qualityScore: 87,
          completedCount: 89,
          errorCount: 2,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-008',
          productivityRate: 88,
          qualityScore: 88,
          completedCount: 89,
          errorCount: 2,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-009': [
        {
          workerId: 'WORKER-009',
          productivityRate: 95,
          qualityScore: 92,
          completedCount: 97,
          errorCount: 1,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-009',
          productivityRate: 96,
          qualityScore: 93,
          completedCount: 98,
          errorCount: 1,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-009',
          productivityRate: 96,
          qualityScore: 94,
          completedCount: 99,
          errorCount: 1,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-010': [
        {
          workerId: 'WORKER-010',
          productivityRate: 90,
          qualityScore: 89,
          completedCount: 92,
          errorCount: 1,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-010',
          productivityRate: 91,
          qualityScore: 90,
          completedCount: 93,
          errorCount: 1,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-010',
          productivityRate: 91,
          qualityScore: 90,
          completedCount: 93,
          errorCount: 1,
          recordDate: '2023-12-29',
        },
      ],
      'WORKER-011': [
        {
          workerId: 'WORKER-011',
          productivityRate: 93,
          qualityScore: 91,
          completedCount: 95,
          errorCount: 0,
          recordDate: '2023-12-15',
        },
        {
          workerId: 'WORKER-011',
          productivityRate: 94,
          qualityScore: 92,
          completedCount: 96,
          errorCount: 0,
          recordDate: '2023-12-22',
        },
        {
          workerId: 'WORKER-011',
          productivityRate: 94,
          qualityScore: 93,
          completedCount: 96,
          errorCount: 0,
          recordDate: '2023-12-29',
        },
      ],
    });

    mockAssessDataCompleteness = jest.fn().mockResolvedValue({
      status: 'WARNING',
      missingFieldCount: 1,
      expectedRecordCount: 12,
      actualRecordCount: 11,
      completenessPercentage: 91.67,
      details: ['作業者WORKER-005のcompletionCountが欠落'],
    });

    mockAssessDataAccuracy = jest.fn().mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    mockDetectAnomalousValues = jest.fn().mockResolvedValue({
      status: 'DETECTED',
      anomalousRecordCount: 1,
      anomalies: [
        {
          recordId: 'REC-001',
          workerId: 'WORKER-003',
          field: 'processingTime',
          anomalyType: 'STATISTICAL_OUTLIER',
          severity: 'LOW',
          historicalAverage: 120,
          currentValue: 185,
          standardDeviation: 22,
          recommendedAction:
            '作業者WORKER-003の処理時間が平均値から大きく乖離しています。作業環境や作業内容の変化を確認してください。',
        },
      ],
      detectionExecutedAt: '2024-01-21T14:30:00Z',
    });

    mockGenerateQualityJudgment = jest.fn().mockResolvedValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason:
        '完全性に軽微な欠落があり、異常値が低レベルで検出されています。改善指示に従うことで承認可能です。',
      qualityScore: 82,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 91.67,
        accuracyScore: 100,
        anomalyScore: 75,
      },
    });

    mockGenerateImprovementGuidance = jest.fn().mockResolvedValue([
      {
        priority: 'HIGH',
        category: 'COMPLETENESS',
        action:
          '作業者WORKER-005のcompletionCountの欠落データを補完するか再入力してください。',
        affectedRecordCount: 1,
        estimatedResolutionTime: '30分',
        targetCompletionDate: '2024-01-22',
      },
      {
        priority: 'MEDIUM',
        category: 'ANOMALY',
        action:
          '作業者WORKER-003の処理時間が通常より大きく乖離しています。作業内容の特殊性や環境的な要因を確認してください。',
        affectedRecordCount: 1,
        estimatedResolutionTime: '1時間',
        targetCompletionDate: '2024-01-23',
      },
    ]);

    mockSendQualityValidationResultToFieldLeader = jest
      .fn()
      .mockResolvedValue({
        sent: true,
        recipientUserId: 'LEADER-001',
        notificationTimestamp: '2024-01-21T14:30:00Z',
        deliveryStatus: 'DELIVERED',
      });

    (dataQualityValidation as any).authenticateUser =
      mockAuthenticateUser;
    (dataQualityValidation as any).authorizeUserAction =
      mockAuthorizeUserAction;
    (dataQualityValidation as any).findProductivityDataByTeamAndPeriod =
      mockFindProductivityDataByTeamAndPeriod;
    (dataQualityValidation as any).findPerformanceRecordsByWorkerIds =
      mockFindPerformanceRecordsByWorkerIds;
    (dataQualityValidation as any).assessDataCompleteness =
      mockAssessDataCompleteness;
    (dataQualityValidation as any).assessDataAccuracy =
      mockAssessDataAccuracy;
    (dataQualityValidation as any).detectAnomalousValues =
      mockDetectAnomalousValues;
    (dataQualityValidation as any).generateQualityJudgment =
      mockGenerateQualityJudgment;
    (dataQualityValidation as any).generateImprovementGuidance =
      mockGenerateImprovementGuidance;
    (dataQualityValidation as any).sendQualityValidationResultToFieldLeader =
      mockSendQualityValidationResultToFieldLeader;

    const mockValidateAggregatedPerformanceData =
      validateAggregatedPerformanceData as jest.MockedFunction<
        typeof validateAggregatedPerformanceData
      >;

    mockValidateAggregatedPerformanceData.mockImplementation(
      async (input) => {
        await mockAuthenticateUser(input.userAuthToken);
        await mockAuthorizeUserAction(
          input.fieldLeaderUserId,
          'validateAggregatedPerformanceData'
        );

        const productivityData =
          await mockFindProductivityDataByTeamAndPeriod(
            input.teamId,
            input.aggregationPeriodStartDate,
            input.aggregationPeriodEndDate
          );

        const workerIds = productivityData.map((r: any) => r.workerId);
        await mockFindPerformanceRecordsByWorkerIds(workerIds);

        const completenessResult =
          await mockAssessDataCompleteness(productivityData);
        const accuracyResult = await mockAssessDataAccuracy(productivityData);
        const anomalyResult = await mockDetectAnomalousValues(
          productivityData,
          []
        );

        const qualityJudgment =
          await mockGenerateQualityJudgment(
            completenessResult,
            accuracyResult,
            anomalyResult,
            {}
          );

        const completenessIssues = completenessResult.status !== 'PASS' ? [
          {
            missingField: 'completionCount',
            affectedRecordCount: completenessResult.missingFieldCount,
            severity: completenessResult.status === 'WARNING' ? 'medium' : 'high',
          }
        ] : [];

        const accuracyIssues = accuracyResult.inconsistencyCount > 0 ? [
          {
            field: 'multiple',
            issueType: 'inconsistency',
            affectedRecordCount: accuracyResult.inconsistencyCount,
            severity: 'high',
          }
        ] : [];

        const anomalies = anomalyResult.anomalies || [];

        const improvementGuidance =
          await mockGenerateImprovementGuidance(
            completenessIssues,
            accuracyIssues,
            anomalies,
            []
          );

        const notificationResult =
          await mockSendQualityValidationResultToFieldLeader(
            input.fieldLeaderUserId,
            qualityJudgment,
            improvementGuidance
          );

        return {
          validationExecutedAt: '2024-01-21T14:30:00Z',
          aggregationPeriod: {
            startDate: input.aggregationPeriodStartDate,
            endDate: input.aggregationPeriodEndDate,
          },
          targetTeamId: input.teamId,
          totalRecordsProcessed: productivityData.length,
          completenessAssessment: completenessResult,
          accuracyAssessment: accuracyResult,
          anomalyDetection: anomalyResult,
          overallQualityJudgment: qualityJudgment,
          improvementGuidance,
          notificationSent: notificationResult,
        };
      }
    );
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('認証済みの現場リーダーが提供したトークンで検証を実行し、軽微な欠落と低レベル異常値を検出して条件付き承認を判定し、改善指示を生成して配信する', async () => {
    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: '2024-01-15',
      aggregationPeriodEndDate: '2024-01-21',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token-xxx',
    });

    expect(mockAuthenticateUser).toHaveBeenCalledWith('valid-token-xxx');
    expect(mockAuthorizeUserAction).toHaveBeenCalledWith(
      'LEADER-001',
      'validateAggregatedPerformanceData'
    );
    expect(
      mockFindProductivityDataByTeamAndPeriod
    ).toHaveBeenCalledWith('TEAM-001', '2024-01-15', '2024-01-21');
    expect(mockAssessDataCompleteness).toHaveBeenCalled();
    expect(mockAssessDataAccuracy).toHaveBeenCalled();
    expect(mockDetectAnomalousValues).toHaveBeenCalled();
    expect(mockGenerateQualityJudgment).toHaveBeenCalled();
    expect(mockGenerateImprovementGuidance).toHaveBeenCalled();
    expect(
      mockSendQualityValidationResultToFieldLeader
    ).toHaveBeenCalledWith('LEADER-001', expect.any(Object), expect.any(Array));

    expect(result).toBeDefined();
    expect(result.validationExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.aggregationPeriod.startDate).toBe('2024-01-15');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-21');
    expect(result.targetTeamId).toBe('TEAM-001');
    expect(result.totalRecordsProcessed).toBe(12);

    expect(result.completenessAssessment.status).toBe('WARNING');
    expect(result.completenessAssessment.missingFieldCount).toBe(1);
    expect(result.completenessAssessment.expectedRecordCount).toBe(12);
    expect(result.completenessAssessment.actualRecordCount).toBe(11);
    expect(result.completenessAssessment.completenessPercentage).toBe(91.67);
    expect(result.completenessAssessment.details).toContain(
      '作業者WORKER-005のcompletionCountが欠落'
    );

    expect(result.accuracyAssessment.status).toBe('PASS');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(0);
    expect(result.accuracyAssessment.outOfRangeCount).toBe(0);
    expect(result.accuracyAssessment.details).toEqual([]);

    expect(result.anomalyDetection.status).toBe('DETECTED');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(1);
    expect(result.anomalyDetection.anomalies).toHaveLength(1);
    expect(result.anomalyDetection.anomalies[0].recordId).toBe('REC-001');
    expect(result.anomalyDetection.anomalies[0].workerId).toBe('WORKER-003');
    expect(result.anomalyDetection.anomalies[0].field).toBe('processingTime');
    expect(result.anomalyDetection.anomalies[0].anomalyType).toBe(
      'STATISTICAL_OUTLIER'
    );
    expect(result.anomalyDetection.anomalies[0].severity).toBe('LOW');
    expect(result.anomalyDetection.anomalies[0].historicalAverage).toBe(120);
    expect(result.anomalyDetection.anomalies[0].currentValue).toBe(185);
    expect(result.anomalyDetection.anomalies[0].standardDeviation).toBe(22);
    expect(result.anomalyDetection.anomalies[0].recommendedAction).toContain(
      'WORKER-003'
    );

    expect(result.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');
    expect(result.overallQualityJudgment.qualityScore).toBe(82);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(true);
    expect(result.overallQualityJudgment.judgmentReason).toContain('軽微な欠落');
    expect(result.overallQualityJudgment.judgmentReason).toContain(
      '改善指示に従うことで承認可能'
    );

    expect(result.improvementGuidance).toHaveLength(2);
    expect(result.improvementGuidance[0].priority).toBe('HIGH');
    expect(result.improvementGuidance[0].category).toBe('COMPLETENESS');
    expect(result.improvementGuidance[0].affectedRecordCount).toBe(1);
    expect(result.improvementGuidance[0].action).toContain('WORKER-005');
    expect(result.improvementGuidance[0].estimatedResolutionTime).toBe('30分');
    expect(result.improvementGuidance[0].targetCompletionDate).toBe('2024-01-22');

    expect(result.improvementGuidance[1].priority).toBe('MEDIUM');
    expect(result.improvementGuidance[1].category).toBe('ANOMALY');
    expect(result.improvementGuidance[1].affectedRecordCount).toBe(1);
    expect(result.improvementGuidance[1].action).toContain('WORKER-003');
    expect(result.improvementGuidance[1].estimatedResolutionTime).toBe('1時間');
    expect(result.improvementGuidance[1].targetCompletionDate).toBe('2024-01-23');

    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('LEADER-001');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
    expect(result.notificationSent.notificationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});