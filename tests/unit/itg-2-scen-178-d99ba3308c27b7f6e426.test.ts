import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-178: エラー：作業時間の矛盾や生産性率が物理的に不可能な値を持つ場合、DataAccuracyValidationFailedErrorが発生する', () => {
  it('should throw DataAccuracyValidationFailedError when accuracy assessment detects contradictions and out-of-range values', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-15',
      aggregationPeriodEndDate: '2024-01-15',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token',
    };

    const mockAiClient = {
      authenticateUser: jest.fn().mockResolvedValue({ isValid: true }),
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      findProductivityDataByTeamAndPeriod: jest.fn().mockResolvedValue([
        {
          productivityDataId: 'REC-001',
          workerId: 'WORKER-001',
          plannedWorkingHours: 8,
          actualWorkingHours: -2,
          completedCount: 50,
          productivityRate: 90,
          qualityScore: 85,
          errorCount: 2,
          proficiencyLevel: 'intermediate',
        },
        {
          productivityDataId: 'REC-002',
          workerId: 'WORKER-002',
          plannedWorkingHours: 8,
          actualWorkingHours: 8,
          completedCount: 50,
          productivityRate: 120,
          qualityScore: 85,
          errorCount: 2,
          proficiencyLevel: 'intermediate',
        },
        {
          productivityDataId: 'REC-003',
          workerId: 'WORKER-003',
          plannedWorkingHours: 8,
          actualWorkingHours: 8,
          completedCount: 50,
          productivityRate: 90,
          qualityScore: 105,
          errorCount: 2,
          proficiencyLevel: 'intermediate',
        },
      ]),
      assessDataAccuracy: jest.fn().mockResolvedValue({
        status: 'FAIL',
        inconsistencyCount: 3,
        outOfRangeCount: 3,
        details: [
          {
            recordId: 'REC-001',
            field: 'processingTime',
            issue: '終了時刻が開始時刻より前',
            expectedRange: '0 以上',
            actualValue: '-2',
          },
          {
            recordId: 'REC-002',
            field: 'productivityMetric',
            issue: '100%を超過',
            expectedRange: '0-100',
            actualValue: '120',
          },
          {
            recordId: 'REC-003',
            field: 'qualityMetric',
            issue: '定義範囲外',
            expectedRange: '0-100',
            actualValue: '105',
          },
        ],
      }),
      generateQualityJudgment: jest.fn().mockResolvedValue({
        judgment: 'REJECTED',
        judgmentReason: 'Data accuracy issues detected',
        qualityScore: 45,
        approvalEligibility: false,
        componentScores: {
          completenessScore: 90,
          accuracyScore: 20,
          anomalyScore: 50,
        },
      }),
      generateImprovementGuidance: jest.fn().mockResolvedValue({
        guidanceItems: [
          {
            priority: 'CRITICAL',
            category: 'ACCURACY',
            action: '時間矛盾と物理的に不可能な生産性値を是正してください',
            affectedRecordCount: 3,
            estimatedResolutionTime: '2 hours',
            targetCompletionDate: '2024-01-16',
          },
        ],
        generatedAt: '2024-01-15T10:00:00Z',
        totalGuidanceCount: 1,
        criticalActionCount: 1,
      }),
      sendQualityValidationResultToFieldLeader: jest.fn().mockResolvedValue({
        sent: true,
        recipientUserId: 'LEADER-001',
        notificationTimestamp: '2024-01-15T10:00:00Z',
        deliveryStatus: 'DELIVERED',
      }),
    };

    await expect(
      validateAggregatedPerformanceData(input, mockAiClient as any)
    ).rejects.toThrow(expect.objectContaining({
      message: expect.stringContaining('データの正確性に問題があります'),
    }));
  });

  it('should capture accuracy assessment details when error is thrown', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-15',
      aggregationPeriodEndDate: '2024-01-15',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token',
    };

    const mockAiClient = {
      authenticateUser: jest.fn().mockResolvedValue({ isValid: true }),
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      findProductivityDataByTeamAndPeriod: jest.fn().mockResolvedValue([
        {
          productivityDataId: 'REC-001',
          workerId: 'WORKER-001',
          plannedWorkingHours: 8,
          actualWorkingHours: -2,
          completedCount: 50,
          productivityRate: 90,
          qualityScore: 85,
          errorCount: 2,
          proficiencyLevel: 'intermediate',
        },
        {
          productivityDataId: 'REC-002',
          workerId: 'WORKER-002',
          plannedWorkingHours: 8,
          actualWorkingHours: 8,
          completedCount: 50,
          productivityRate: 120,
          qualityScore: 85,
          errorCount: 2,
          proficiencyLevel: 'intermediate',
        },
        {
          productivityDataId: 'REC-003',
          workerId: 'WORKER-003',
          plannedWorkingHours: 8,
          actualWorkingHours: 8,
          completedCount: 50,
          productivityRate: 90,
          qualityScore: 105,
          errorCount: 2,
          proficiencyLevel: 'intermediate',
        },
      ]),
      assessDataAccuracy: jest.fn().mockResolvedValue({
        status: 'FAIL',
        inconsistencyCount: 3,
        outOfRangeCount: 3,
        details: [
          {
            recordId: 'REC-001',
            field: 'processingTime',
            issue: '終了時刻が開始時刻より前',
            expectedRange: '0 以上',
            actualValue: '-2',
          },
          {
            recordId: 'REC-002',
            field: 'productivityMetric',
            issue: '100%を超過',
            expectedRange: '0-100',
            actualValue: '120',
          },
          {
            recordId: 'REC-003',
            field: 'qualityMetric',
            issue: '定義範囲外',
            expectedRange: '0-100',
            actualValue: '105',
          },
        ],
      }),
      generateQualityJudgment: jest.fn().mockResolvedValue({
        judgment: 'REJECTED',
        judgmentReason: 'Data accuracy issues detected',
        qualityScore: 45,
        approvalEligibility: false,
        componentScores: {
          completenessScore: 90,
          accuracyScore: 20,
          anomalyScore: 50,
        },
      }),
      generateImprovementGuidance: jest.fn().mockResolvedValue({
        guidanceItems: [
          {
            priority: 'CRITICAL',
            category: 'ACCURACY',
            action: '時間矛盾と物理的に不可能な生産性値を是正してください',
            affectedRecordCount: 3,
            estimatedResolutionTime: '2 hours',
            targetCompletionDate: '2024-01-16',
          },
        ],
        generatedAt: '2024-01-15T10:00:00Z',
        totalGuidanceCount: 1,
        criticalActionCount: 1,
      }),
      sendQualityValidationResultToFieldLeader: jest.fn().mockResolvedValue({
        sent: true,
        recipientUserId: 'LEADER-001',
        notificationTimestamp: '2024-01-15T10:00:00Z',
        deliveryStatus: 'DELIVERED',
      }),
    };

    try {
      await validateAggregatedPerformanceData(input, mockAiClient as any);
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message).toContain('データの正確性に問題があります');
      
      if (error.accuracyAssessment) {
        expect(error.accuracyAssessment.outOfRangeCount).toBe(3);
        expect(error.accuracyAssessment.inconsistencyCount).toBe(3);
        expect(error.accuracyAssessment.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              recordId: 'REC-001',
              field: 'processingTime',
              issue: '終了時刻が開始時刻より前',
              expectedRange: '0 以上',
              actualValue: '-2',
            }),
            expect.objectContaining({
              recordId: 'REC-002',
              field: 'productivityMetric',
              issue: '100%を超過',
              expectedRange: '0-100',
              actualValue: '120',
            }),
            expect.objectContaining({
              recordId: 'REC-003',
              field: 'qualityMetric',
              issue: '定義範囲外',
              expectedRange: '0-100',
              actualValue: '105',
            }),
          ])
        );
      }
      
      if (error.overallQualityJudgment) {
        expect(error.overallQualityJudgment.judgment).toBe('REJECTED');
      }
    }
  });
});