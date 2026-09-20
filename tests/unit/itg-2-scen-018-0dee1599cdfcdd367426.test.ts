import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

class NotificationDeliveryFailureException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationDeliveryFailureException';
  }
}

describe('SCEN-018: Tx2Imp1Agent - NotificationDeliveryFailureException on notification failure', () => {
  it('should throw NotificationDeliveryFailureException when sendQualityValidationResultToFieldLeader fails', async () => {
    const input = {
      triggerType: 'scheduled' as const,
      targetDate: '2024-01-15',
      executorUserId: 'user123',
    };

    const mockAiClient = {
      executeDailyBatchProcess: jest.fn().mockResolvedValue({
        aggregationResult: {
          aggregatedRecordCount: 100,
          aggregationPeriod: '2024-01-15',
          completenessScore: 95,
        },
        analysisResult: {
          analysisType: 'productivity_trend',
          keyFindings: ['Finding 1'],
          recommendedActions: ['Action 1'],
        },
        validationResult: {
          validationStatus: 'passed' as const,
          anomalousRecords: [],
          improvementGuidance: [],
        },
      }),
      validateAggregatedPerformanceData: jest.fn().mockResolvedValue({
        validationStatus: 'passed' as const,
        anomalousRecords: [],
        improvementGuidance: [],
      }),
      verifyAndScoreAnalysisResult: jest.fn().mockResolvedValue({
        validityScore: 85,
        validityJudgment: 'valid' as const,
        judgmentReason: 'Analysis is valid',
        approvalRecommendation: 'Approve',
      }),
      sendQualityValidationResultToFieldLeader: jest.fn().mockRejectedValue(
        new NotificationDeliveryFailureException('報告・指示の配信に失敗しました。手動確認が必要です。')
      ),
    };

    try {
      await runTx2Imp1Agent(input, mockAiClient);
      fail('Should have thrown NotificationDeliveryFailureException');
    } catch (error: any) {
      expect(error).toBeInstanceOf(NotificationDeliveryFailureException);
      expect(error.message).toContain('報告・指示の配信に失敗しました。手動確認が必要です。');
    }
  });

  it('should throw NotificationDeliveryFailureException when sendAnalysisResultVerificationToManager fails', async () => {
    const input = {
      triggerType: 'scheduled' as const,
      targetDate: '2024-01-15',
      executorUserId: 'user123',
    };

    const mockAiClient = {
      executeDailyBatchProcess: jest.fn().mockResolvedValue({
        aggregationResult: {
          aggregatedRecordCount: 100,
          aggregationPeriod: '2024-01-15',
          completenessScore: 95,
        },
        analysisResult: {
          analysisType: 'productivity_trend',
          keyFindings: ['Finding 1'],
          recommendedActions: ['Action 1'],
        },
        validationResult: {
          validationStatus: 'passed' as const,
          anomalousRecords: [],
          improvementGuidance: [],
        },
      }),
      validateAggregatedPerformanceData: jest.fn().mockResolvedValue({
        validationStatus: 'passed' as const,
        anomalousRecords: [],
        improvementGuidance: [],
      }),
      verifyAndScoreAnalysisResult: jest.fn().mockResolvedValue({
        validityScore: 85,
        validityJudgment: 'valid' as const,
        judgmentReason: 'Analysis is valid',
        approvalRecommendation: 'Approve',
      }),
      sendQualityValidationResultToFieldLeader: jest.fn().mockResolvedValue({
        notificationId: 'notif123',
        recipientType: 'field_leader' as const,
        deliveryStatus: 'success' as const,
        deliveryTimestamp: new Date().toISOString(),
      }),
      sendAnalysisResultVerificationToManager: jest.fn().mockRejectedValue(
        new NotificationDeliveryFailureException('報告・指示の配信に失敗しました。手動確認が必要です。')
      ),
    };

    try {
      await runTx2Imp1Agent(input, mockAiClient);
      fail('Should have thrown NotificationDeliveryFailureException');
    } catch (error: any) {
      expect(error).toBeInstanceOf(NotificationDeliveryFailureException);
      expect(error.message).toContain('報告・指示の配信に失敗しました。手動確認が必要です。');
    }
  });

  it('should include error details in the exception when notification delivery fails', async () => {
    const input = {
      triggerType: 'scheduled' as const,
      targetDate: '2024-01-15',
      executorUserId: 'user123',
    };

    const mockAiClient = {
      executeDailyBatchProcess: jest.fn().mockResolvedValue({
        aggregationResult: {
          aggregatedRecordCount: 100,
          aggregationPeriod: '2024-01-15',
          completenessScore: 95,
        },
        analysisResult: {
          analysisType: 'productivity_trend',
          keyFindings: ['Finding 1'],
          recommendedActions: ['Action 1'],
        },
        validationResult: {
          validationStatus: 'passed' as const,
          anomalousRecords: [],
          improvementGuidance: [],
        },
      }),
      validateAggregatedPerformanceData: jest.fn().mockResolvedValue({
        validationStatus: 'passed' as const,
        anomalousRecords: [],
        improvementGuidance: [],
      }),
      verifyAndScoreAnalysisResult: jest.fn().mockResolvedValue({
        validityScore: 85,
        validityJudgment: 'valid' as const,
        judgmentReason: 'Analysis is valid',
        approvalRecommendation: 'Approve',
      }),
      sendQualityValidationResultToFieldLeader: jest.fn().mockRejectedValue(
        new NotificationDeliveryFailureException('報告・指示の配信に失敗しました。手動確認が必要です。')
      ),
    };

    try {
      await runTx2Imp1Agent(input, mockAiClient);
      fail('Should have thrown NotificationDeliveryFailureException');
    } catch (error: any) {
      expect(error).toBeInstanceOf(NotificationDeliveryFailureException);
      expect(error.message).toContain('報告・指示の配信に失敗しました。手動確認が必要です。');
    }
  });
});