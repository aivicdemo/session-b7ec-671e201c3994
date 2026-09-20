import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-189: 日次集約データの品質検証と改善指示生成', () => {
  let mockAuthenticateUser: jest.Mock;
  let mockAuthorizeUserAction: jest.Mock;
  let mockFindProductivityDataByTeamAndPeriod: jest.Mock;
  let mockAssessDataCompleteness: jest.Mock;
  let mockAssessDataAccuracy: jest.Mock;
  let mockDetectAnomalousValues: jest.Mock;
  let mockGenerateQualityJudgment: jest.Mock;
  let mockGenerateImprovementGuidance: jest.Mock;
  let mockSendQualityValidationResultToFieldLeader: jest.Mock;

  beforeEach(() => {
    mockAuthenticateUser = jest.fn().mockResolvedValue({ userId: 'FL-12345' });
    mockAuthorizeUserAction = jest.fn().mockResolvedValue({ authorized: true });
    
    mockFindProductivityDataByTeamAndPeriod = jest.fn().mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => {
        if (i === 0) {
          return {
            productivityDataId: 'REC001',
            workerId: 'W001',
            plannedWorkingHours: 8,
            actualWorkingHours: 7.5,
            completedCount: 20,
            productivityRate: 95,
            qualityScore: 92,
            errorCount: 1,
            proficiencyLevel: 'intermediate',
          };
        } else if (i === 1) {
          return {
            productivityDataId: 'REC002',
            workerId: 'W002',
            plannedWorkingHours: 8,
            actualWorkingHours: 8,
            completedCount: 18,
            productivityRate: 85,
            qualityScore: 70,
            errorCount: 3,
            proficiencyLevel: 'beginner',
          };
        } else if (i === 2) {
          return {
            productivityDataId: 'REC003',
            workerId: 'W003',
            plannedWorkingHours: 8,
            actualWorkingHours: 8,
            completedCount: 5,
            productivityRate: 50,
            qualityScore: 88,
            errorCount: 0,
            proficiencyLevel: 'intermediate',
          };
        } else {
          return {
            productivityDataId: `REC${String(i + 1).padStart(3, '0')}`,
            workerId: `W${String(i + 1).padStart(3, '0')}`,
            plannedWorkingHours: 8,
            actualWorkingHours: 8,
            completedCount: 15,
            productivityRate: 80,
            qualityScore: 85,
            errorCount: 1,
            proficiencyLevel: 'intermediate',
          };
        }
      })
    );

    mockAssessDataCompleteness = jest.fn().mockResolvedValue({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 20,
      actualRecordCount: 20,
      completenessPercentage: 98.5,
      details: [],
    });

    mockAssessDataAccuracy = jest.fn().mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    mockDetectAnomalousValues = jest.fn().mockResolvedValue({
      status: 'DETECTED',
      anomalousRecordCount: 3,
      anomalies: [
        {
          recordId: 'REC001',
          workerId: 'W001',
          field: 'processingTime',
          anomalyType: 'STATISTICAL_OUTLIER',
          severity: 'HIGH',
          historicalAverage: 180,
          currentValue: 450,
          standardDeviation: 45,
          recommendedAction: '即座に作業者W001の作業内容を確認してください',
        },
        {
          recordId: 'REC002',
          workerId: 'W002',
          field: 'errorRate',
          anomalyType: 'BUSINESS_RULE_VIOLATION',
          severity: 'MEDIUM',
          currentValue: 0.15,
          recommendedAction: 'エラー率15%は業務ルール上限を超えています',
        },
        {
          recordId: 'REC003',
          workerId: 'W003',
          field: 'completionCount',
          anomalyType: 'STATISTICAL_OUTLIER',
          severity: 'LOW',
          currentValue: 5,
          recommendedAction: '完了数の低下傾向を注視してください',
        },
      ],
      detectionExecutedAt: new Date().toISOString(),
    });

    mockGenerateQualityJudgment = jest.fn().mockResolvedValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '複数の異常値が検出されましたが、データ完全性と正確性は満たしています',
      qualityScore: 75,
      approvalEligibility: false,
      componentScores: {
        completenessScore: 98.5,
        accuracyScore: 100,
        anomalyScore: 50,
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);

    mockGenerateImprovementGuidance = jest.fn().mockResolvedValue({
      guidanceItems: [
        {
          priority: 'CRITICAL',
          category: 'ANOMALY',
          action: 'HIGH重大度異常値への確認・対応：作業者W001の処理時間450分は過去平均180分から2.5標準偏差乖離',
          affectedRecordCount: 1,
          estimatedResolutionTime: '1時間',
          targetCompletionDate: tomorrow.toISOString(),
        },
        {
          priority: 'HIGH',
          category: 'ANOMALY',
          action: 'MEDIUM重大度異常値への調査：作業者W002のエラー率15%は業務ルール上限超過',
          affectedRecordCount: 1,
          estimatedResolutionTime: '2時間',
          targetCompletionDate: tomorrow.toISOString(),
        },
        {
          priority: 'MEDIUM',
          category: 'ANOMALY',
          action: 'LOW重大度異常値の監視：作業者W003の完了数低下傾向をトレンド分析',
          affectedRecordCount: 1,
          estimatedResolutionTime: '30分',
          targetCompletionDate: twoDaysLater.toISOString(),
        },
      ],
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 3,
      criticalActionCount: 1,
    });

    mockSendQualityValidationResultToFieldLeader = jest.fn().mockResolvedValue({
      sent: true,
      recipientUserId: 'FL-12345',
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
    });

    jest.doMock('../../src/logic/data-quality-validation', () => ({
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      findProductivityDataByTeamAndPeriod: mockFindProductivityDataByTeamAndPeriod,
      assessDataCompleteness: mockAssessDataCompleteness,
      assessDataAccuracy: mockAssessDataAccuracy,
      detectAnomalousValues: mockDetectAnomalousValues,
      generateQualityJudgment: mockGenerateQualityJudgment,
      generateImprovementGuidance: mockGenerateImprovementGuidance,
      sendQualityValidationResultToFieldLeader: mockSendQualityValidationResultToFieldLeader,
      validateAggregatedPerformanceData: jest.fn(async (input) => {
        await mockAuthenticateUser(input.userAuthToken);
        await mockAuthorizeUserAction(input.fieldLeaderUserId);
        
        const aggregatedRecords = await mockFindProductivityDataByTeamAndPeriod(
          input.teamId,
          input.aggregationPeriodStartDate,
          input.aggregationPeriodEndDate
        );

        const completenessResult = await mockAssessDataCompleteness({
          aggregatedRecords,
          expectedRecordCount: 20,
          requiredFields: ['productivityDataId', 'workerId', 'completedCount'],
        });

        const accuracyResult = await mockAssessDataAccuracy({
          aggregatedRecords,
          validationRules: {
            productivityRateMax: 100,
            productivityRateMin: 0,
            qualityScoreMax: 100,
            qualityScoreMin: 0,
            workingHoursMax: 12,
            workingHoursMin: 0,
          },
        });

        const anomalyResult = await mockDetectAnomalousValues({
          currentRecords: aggregatedRecords,
          historicalRecords: [],
          anomalyThresholds: {
            standardDeviationMultiplier: 2.5,
            businessRuleViolations: [
              { field: 'errorRate', condition: '> 0.10', severity: 'MEDIUM' },
            ],
          },
        });

        const judgmentResult = await mockGenerateQualityJudgment({
          completenessResult,
          accuracyResult,
          anomalyResult,
          judgmentCriteria: {
            completenessWeighting: 0.3,
            accuracyWeighting: 0.3,
            anomalyWeighting: 0.4,
            approvalThreshold: 80,
          },
        });

        const guidanceResult = await mockGenerateImprovementGuidance({
          completenessIssues: [],
          accuracyIssues: [],
          anomalies: anomalyResult.anomalies.map((a: any) => ({
            recordId: a.recordId,
            anomalyType: a.anomalyType,
            severity: a.severity,
          })),
          actionCatalog: [
            {
              issueCategory: 'ANOMALY',
              issueType: 'STATISTICAL_OUTLIER',
              recommendedAction: '統計的外れ値への対応',
              estimatedResolutionTime: '1時間',
            },
          ],
        });

        const notificationResult = await mockSendQualityValidationResultToFieldLeader({
          fieldLeaderUserId: input.fieldLeaderUserId,
          validationResults: {
            completeness: completenessResult,
            accuracy: accuracyResult,
            anomalies: anomalyResult,
            judgment: judgmentResult,
            guidance: guidanceResult,
          },
        });

        return {
          validationExecutedAt: new Date().toISOString(),
          aggregationPeriod: {
            startDate: input.aggregationPeriodStartDate,
            endDate: input.aggregationPeriodEndDate,
          },
          targetTeamId: input.teamId,
          totalRecordsProcessed: aggregatedRecords.length,
          completenessAssessment: completenessResult,
          accuracyAssessment: accuracyResult,
          anomalyDetection: anomalyResult,
          overallQualityJudgment: judgmentResult,
          improvementGuidance: guidanceResult.guidanceItems,
          notificationSent: notificationResult,
        };
      }),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('正常系：複数の異常値が異なる重大度レベルで検出され、優先度と改善指示が重大度に応じて正しく割り当てられる', async () => {
    const { validateAggregatedPerformanceData: validate } = await import(
      '../../src/logic/data-quality-validation'
    );

    const beforeExecution = new Date();
    const result = await validate({
      aggregationPeriodStartDate: '2024-01-15',
      aggregationPeriodEndDate: '2024-01-15',
      teamId: 'TEAM-A',
      siteId: 'SITE-001',
      fieldLeaderUserId: 'FL-12345',
      userAuthToken: 'valid_token_xyz',
    });
    const afterExecution = new Date();

    expect(result.validationExecutedAt).toBeDefined();
    const executedTime = new Date(result.validationExecutedAt);
    expect(executedTime.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
    expect(executedTime.getTime()).toBeLessThanOrEqual(afterExecution.getTime());

    expect(result.aggregationPeriod.startDate).toBe('2024-01-15');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-15');
    expect(result.targetTeamId).toBe('TEAM-A');
    expect(result.totalRecordsProcessed).toBe(20);

    expect(result.completenessAssessment.status).toBe('PASS');
    expect(result.completenessAssessment.completenessPercentage).toBe(98.5);
    expect(result.completenessAssessment.missingFieldCount).toBe(0);
    expect(result.completenessAssessment.expectedRecordCount).toBe(20);
    expect(result.completenessAssessment.actualRecordCount).toBe(20);
    expect(result.completenessAssessment.details).toEqual([]);

    expect(result.accuracyAssessment.status).toBe('PASS');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(0);
    expect(result.accuracyAssessment.outOfRangeCount).toBe(0);
    expect(result.accuracyAssessment.details).toEqual([]);

    expect(result.anomalyDetection.status).toBe('DETECTED');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(3);
    expect(result.anomalyDetection.anomalies).toHaveLength(3);

    expect(result.anomalyDetection.anomalies[0].severity).toBe('HIGH');
    expect(result.anomalyDetection.anomalies[0].recommendedAction).toBe(
      '即座に作業者W001の作業内容を確認してください'
    );
    expect(result.anomalyDetection.anomalies[0].currentValue).toBe(450);

    expect(result.anomalyDetection.anomalies[1].severity).toBe('MEDIUM');
    expect(result.anomalyDetection.anomalies[1].recommendedAction).toBe(
      'エラー率15%は業務ルール上限を超えています'
    );
    expect(result.anomalyDetection.anomalies[1].currentValue).toBe(0.15);

    expect(result.anomalyDetection.anomalies[2].severity).toBe('LOW');
    expect(result.anomalyDetection.anomalies[2].recommendedAction).toBe(
      '完了数の低下傾向を注視してください'
    );
    expect(result.anomalyDetection.anomalies[2].currentValue).toBe(5);

    expect(result.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');
    expect(result.overallQualityJudgment.qualityScore).toBe(75);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(false);

    expect(result.improvementGuidance).toHaveLength(3);
    expect(result.improvementGuidance[0].priority).toBe('CRITICAL');
    expect(result.improvementGuidance[0].category).toBe('ANOMALY');
    expect(result.improvementGuidance[0].affectedRecordCount).toBe(1);
    expect(result.improvementGuidance[0].estimatedResolutionTime).toBe('1時間');

    expect(result.improvementGuidance[1].priority).toBe('HIGH');
    expect(result.improvementGuidance[1].category).toBe('ANOMALY');
    expect(result.improvementGuidance[1].affectedRecordCount).toBe(1);
    expect(result.improvementGuidance[1].estimatedResolutionTime).toBe('2時間');

    expect(result.improvementGuidance[2].priority).toBe('MEDIUM');
    expect(result.improvementGuidance[2].category).toBe('ANOMALY');
    expect(result.improvementGuidance[2].affectedRecordCount).toBe(1);
    expect(result.improvementGuidance[2].estimatedResolutionTime).toBe('30分');

    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('FL-12345');
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
  });
});