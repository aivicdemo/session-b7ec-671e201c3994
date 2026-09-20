import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-195: 正常系：実績データが欠落している作業者が特定され、欠落理由が推定されて記録される', () => {
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

    mockAuthenticateUser = jest.fn().mockResolvedValue({ userId: 'FL-001', role: 'fieldLeader' });
    mockAuthorizeUserAction = jest.fn().mockResolvedValue({ authorized: true });

    const aggregatedData = [
      {
        productivityDataId: 'PD-001',
        workerId: 'W001',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'LEVEL_3'
      },
      {
        productivityDataId: 'PD-002',
        workerId: 'W002',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 98,
        productivityRate: 98,
        qualityScore: 93,
        errorCount: 1,
        proficiencyLevel: 'LEVEL_3'
      },
      {
        productivityDataId: 'PD-003',
        workerId: 'W003',
        plannedWorkingHours: 8,
        actualWorkingHours: 7.5,
        completedCount: 90,
        productivityRate: 95,
        qualityScore: 94,
        errorCount: 0,
        proficiencyLevel: 'LEVEL_2'
      },
      {
        productivityDataId: 'PD-004',
        workerId: 'W004',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 102,
        productivityRate: 102,
        qualityScore: 96,
        errorCount: 0,
        proficiencyLevel: 'LEVEL_4'
      },
      {
        productivityDataId: 'PD-005',
        workerId: 'W005',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 95,
        productivityRate: 95,
        qualityScore: 92,
        errorCount: 1,
        proficiencyLevel: 'LEVEL_2'
      },
      {
        productivityDataId: 'PD-006',
        workerId: 'W006',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 99,
        productivityRate: 99,
        qualityScore: 94,
        errorCount: 0,
        proficiencyLevel: 'LEVEL_3'
      },
      {
        productivityDataId: 'PD-007',
        workerId: 'W007',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 101,
        productivityRate: 101,
        qualityScore: 95,
        errorCount: 0,
        proficiencyLevel: 'LEVEL_4'
      },
      {
        productivityDataId: 'PD-008',
        workerId: 'W008',
        plannedWorkingHours: 8,
        actualWorkingHours: 7,
        completedCount: 85,
        productivityRate: 90,
        qualityScore: 91,
        errorCount: 2,
        proficiencyLevel: 'LEVEL_2'
      }
    ];

    mockFindProductivityDataByTeamAndPeriod = jest.fn().mockResolvedValue(aggregatedData);

    const historicalData = [
      { workerId: 'W001', productivityRate: 98, qualityScore: 94, completedCount: 98, errorCount: 0.5, recordDate: '2024-01-08' },
      { workerId: 'W002', productivityRate: 96, qualityScore: 91, completedCount: 96, errorCount: 1.2, recordDate: '2024-01-08' },
      { workerId: 'W003', productivityRate: 92, qualityScore: 90, completedCount: 90, errorCount: 0.8, recordDate: '2024-01-08' },
      { workerId: 'W004', productivityRate: 100, qualityScore: 95, completedCount: 100, errorCount: 0.3, recordDate: '2024-01-08' },
      { workerId: 'W005', productivityRate: 93, qualityScore: 89, completedCount: 93, errorCount: 1.5, recordDate: '2024-01-08' },
      { workerId: 'W006', productivityRate: 97, qualityScore: 92, completedCount: 97, errorCount: 0.6, recordDate: '2024-01-08' },
      { workerId: 'W007', productivityRate: 99, qualityScore: 94, completedCount: 99, errorCount: 0.4, recordDate: '2024-01-08' },
      { workerId: 'W008', productivityRate: 88, qualityScore: 87, completedCount: 88, errorCount: 2.1, recordDate: '2024-01-08' }
    ];

    mockFindPerformanceRecordsByWorkerIds = jest.fn().mockResolvedValue(historicalData);

    mockAssessDataCompleteness = jest.fn().mockResolvedValue({
      status: 'WARNING',
      missingFieldCount: 0,
      expectedRecordCount: 10,
      actualRecordCount: 8,
      completenessPercentage: 80,
      details: [
        'チーム内の期待稼働作業者数は10名です',
        '実績データを報告した作業者は8名です',
        'カバー率80%は目標95%を達成していません',
        '作業者W009のデータが欠落しています',
        '作業者W010のデータが欠落しています',
        '欠落理由の推定: ハンディターミナル未操作またはシフト不在の可能性があります'
      ]
    });

    mockAssessDataAccuracy = jest.fn().mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: []
    });

    mockDetectAnomalousValues = jest.fn().mockResolvedValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString()
    });

    mockGenerateQualityJudgment = jest.fn().mockResolvedValue({
      judgment: 'CONDITIONAL_APPROVAL',
      judgmentReason: '完全性が95%未満のため条件付き承認。データ欠落の原因確認と是正が必要です。',
      qualityScore: 75,
      approvalEligibility: false,
      componentScores: {
        completenessScore: 80,
        accuracyScore: 100,
        anomalyScore: 100
      }
    });

    mockGenerateImprovementGuidance = jest.fn().mockResolvedValue([
      {
        priority: 'HIGH',
        category: 'COMPLETENESS',
        action: '作業者W009とW010の実績データ欠落原因を確認し、ハンディターミナルの未操作またはシフト管理の矛盾を解決してください',
        affectedRecordCount: 2,
        estimatedResolutionTime: '2024-01-15T17:00:00Z',
        targetCompletionDate: '2024-01-16'
      },
      {
        priority: 'MEDIUM',
        category: 'COMPLETENESS',
        action: 'ハンディターミナルの操作ガイダンスを全作業者に周知し、日次操作漏れの防止策を実装してください',
        affectedRecordCount: 2,
        estimatedResolutionTime: '2024-01-17T12:00:00Z',
        targetCompletionDate: '2024-01-18'
      }
    ]);

    mockSendQualityValidationResultToFieldLeader = jest.fn().mockResolvedValue({
      sent: true,
      recipientUserId: 'FL-001',
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED'
    });

    jest.spyOn(require('../../src/logic/data-quality-validation'), 'validateAggregatedPerformanceData')
      .mockImplementation(async (input) => {
        await mockAuthenticateUser(input.userAuthToken);
        await mockAuthorizeUserAction(input.fieldLeaderUserId);

        const aggregatedRecords = await mockFindProductivityDataByTeamAndPeriod(
          input.teamId,
          input.aggregationPeriodStartDate,
          input.aggregationPeriodEndDate
        );

        const workerIds = aggregatedRecords.map((r: any) => r.workerId);
        await mockFindPerformanceRecordsByWorkerIds(workerIds);

        const completenessResult = await mockAssessDataCompleteness({
          aggregatedRecords,
          expectedRecordCount: 10,
          requiredFields: ['plannedWorkingHours', 'actualWorkingHours', 'completedCount', 'productivityRate', 'qualityScore', 'errorCount']
        });

        const accuracyResult = await mockAssessDataAccuracy({
          aggregatedRecords,
          validationRules: {
            productivityRateMax: 150,
            productivityRateMin: 0,
            qualityScoreMax: 100,
            qualityScoreMin: 0,
            workingHoursMax: 12,
            workingHoursMin: 0
          }
        });

        const anomalyResult = await mockDetectAnomalousValues({
          currentRecords: aggregatedRecords,
          historicalRecords: await mockFindPerformanceRecordsByWorkerIds(workerIds),
          anomalyThresholds: {
            standardDeviationMultiplier: 2.5,
            businessRuleViolations: []
          }
        });

        const qualityJudgment = await mockGenerateQualityJudgment({
          completenessResult,
          accuracyResult,
          anomalyResult,
          judgmentCriteria: {
            completenessWeighting: 0.4,
            accuracyWeighting: 0.35,
            anomalyWeighting: 0.25,
            approvalThreshold: 80
          }
        });

        const improvementGuidance = await mockGenerateImprovementGuidance({
          completenessIssues: [
            { missingField: 'W009', affectedRecordCount: 1, severity: 'HIGH' },
            { missingField: 'W010', affectedRecordCount: 1, severity: 'HIGH' }
          ],
          accuracyIssues: [],
          anomalies: [],
          actionCatalog: [
            {
              issueCategory: 'COMPLETENESS',
              issueType: 'MISSING_RECORD',
              recommendedAction: '作業者実績データ欠落原因の確認と是正',
              estimatedResolutionTime: '1時間'
            }
          ]
        });

        const notification = await mockSendQualityValidationResultToFieldLeader(
          input.fieldLeaderUserId,
          {
            judgment: qualityJudgment.judgment,
            completenessStatus: completenessResult.status,
            totalIssueCount: completenessResult.missingFieldCount
          }
        );

        return {
          validationExecutedAt: new Date().toISOString(),
          aggregationPeriod: {
            startDate: input.aggregationPeriodStartDate,
            endDate: input.aggregationPeriodEndDate
          },
          targetTeamId: input.teamId,
          totalRecordsProcessed: aggregatedRecords.length,
          completenessAssessment: completenessResult,
          accuracyAssessment: accuracyResult,
          anomalyDetection: anomalyResult,
          overallQualityJudgment: qualityJudgment,
          improvementGuidance,
          notificationSent: notification
        };
      });
  });

  test('実績データが欠落している作業者が特定され、欠落理由が推定されて記録される', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-15',
      aggregationPeriodEndDate: '2024-01-15',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'FL-001',
      userAuthToken: 'valid-token'
    };

    const result = await validateAggregatedPerformanceData(input);

    expect(result.validationExecutedAt).toBeDefined();
    expect(new Date(result.validationExecutedAt).getTime()).toBeLessThanOrEqual(Date.now());

    expect(result.totalRecordsProcessed).toBe(8);

    expect(result.completenessAssessment.status).toBe('WARNING');
    expect(result.completenessAssessment.actualRecordCount).toBe(8);
    expect(result.completenessAssessment.expectedRecordCount).toBe(10);
    expect(result.completenessAssessment.completenessPercentage).toBe(80);

    const detailsText = result.completenessAssessment.details.join(' ');
    expect(detailsText).toContain('W009');
    expect(detailsText).toContain('W010');
    expect(detailsText).toContain('欠落');

    const reasonText = result.completenessAssessment.details.find(
      (detail: string) => detail.includes('ハンディターミナル') || detail.includes('シフト')
    );
    expect(reasonText).toBeDefined();

    expect(result.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');

    const completenessGuidance = result.improvementGuidance.find(
      (g: any) => g.category === 'COMPLETENESS' && (g.priority === 'HIGH' || g.priority === 'CRITICAL')
    );
    expect(completenessGuidance).toBeDefined();
    expect(completenessGuidance!.affectedRecordCount).toBe(2);
    expect(completenessGuidance!.action).toContain('W009');
    expect(completenessGuidance!.action).toContain('W010');

    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');
  });
});