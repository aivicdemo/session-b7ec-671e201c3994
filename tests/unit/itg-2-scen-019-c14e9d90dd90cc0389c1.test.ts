import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
  BatchAggregationResult,
  DataQualityValidationResult,
  ErrorDetail,
  NotificationDeliveryRecord,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-019: 集約に成功したが分析に失敗した場合', () => {
  it('executionStatusがpartial_failureで、aggregationResultは返されanalysisResultはnullになる', async () => {
    // Arrange
    const input: Tx2Imp1AgentInput = {
      triggerType: 'scheduled',
      targetDate: '2024-01-15',
      executorUserId: 'user123',
    };

    // Mock the dependencies
    const mockAggregationResult: BatchAggregationResult = {
      aggregatedRecordCount: 1500,
      aggregationPeriod: '2024-01-15',
      completenessScore: 95,
    };

    const mockValidationResult: DataQualityValidationResult = {
      validationStatus: 'passed',
      anomalousRecords: [],
      improvementGuidance: [],
    };

    const mockNotificationRecord: NotificationDeliveryRecord = {
      notificationId: 'notif-001',
      recipientType: 'administrator',
      deliveryStatus: 'success',
      deliveryTimestamp: new Date().toISOString(),
    };

    // Mock AI client
    const mockAiClient = {
      executeDailyBatchProcess: jest
        .fn()
        .mockResolvedValue({ result: mockAggregationResult }),
      validateAggregatedPerformanceData: jest
        .fn()
        .mockResolvedValue({ result: mockValidationResult }),
      verifyAndScoreAnalysisResult: jest.fn().mockRejectedValue(
        new Error('AnalysisResultVerificationFailureException: 分析結果の検証に失敗しました。異常値判定ができません。')
      ),
      sendAnalysisResultVerificationToManager: jest
        .fn()
        .mockResolvedValue(mockNotificationRecord),
    };

    // Act
    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input, mockAiClient as any);

    // Assert
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('partial_failure');
    
    expect(result.aggregationResult).toBeDefined();
    expect(result.aggregationResult?.aggregatedRecordCount).toBe(1500);
    expect(result.aggregationResult?.aggregationPeriod).toBe('2024-01-15');
    expect(result.aggregationResult?.completenessScore).toBe(95);
    
    expect(result.analysisResult).toBeNull();
    
    expect(result.validationResult).toBeDefined();
    expect(result.validationResult?.validationStatus).toBe('passed');
    
    expect(result.verificationResult).toBeNull();
    
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.length).toBeGreaterThan(0);
    expect(
      result.errorDetails?.some(
        (err: ErrorDetail) =>
          err.errorMessage.includes('分析結果の検証に失敗しました') &&
          err.errorMessage.includes('異常値判定ができません')
      )
    ).toBe(true);
    
    expect(mockAiClient.sendAnalysisResultVerificationToManager).toHaveBeenCalled();
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent.length).toBeGreaterThan(0);
    expect(
      result.notificationsSent.some(
        (n: NotificationDeliveryRecord) =>
          n.recipientType === 'administrator' && n.deliveryStatus === 'success'
      )
    ).toBe(true);
    
    expect(result.executionTimestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.executionTimestamp)).toBe(true);
  });
});