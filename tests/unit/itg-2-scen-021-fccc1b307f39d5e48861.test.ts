import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
  Tx2Imp1AiClient,
  BatchAggregationResult,
  DataQualityValidationResult,
  NotificationDeliveryRecord,
  AnomalousRecord,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1: 日次バッチ処理 - 検証成功後スコアリング失敗時の動作', () => {
  it('検証に成功したが検証結果スコアリングに失敗した場合、executionStatusがpartial_failureで、validationResultは返されverificationResultはnullになる', async () => {
    // Create mock implementations
    const mockExecuteDailyBatchProcess = jest.fn();
    const mockValidateAggregatedPerformanceData = jest.fn();
    const mockVerifyAndScoreAnalysisResult = jest.fn();
    const mockSendQualityValidationResultToFieldLeader = jest.fn();
    const mockSendAnalysisResultVerificationToManager = jest.fn();

    // Setup mock for aggregation success
    const mockAggregationResult: BatchAggregationResult = {
      aggregatedRecordCount: 150,
      aggregationPeriod: '2024-01-15',
      completenessScore: 95,
    };
    mockExecuteDailyBatchProcess.mockResolvedValue({
      success: true,
      result: mockAggregationResult,
    });

    // Setup mock for validation success
    const mockValidationResult: DataQualityValidationResult = {
      validationStatus: 'passed',
      anomalousRecords: [] as AnomalousRecord[],
      improvementGuidance: [],
    };
    mockValidateAggregatedPerformanceData.mockResolvedValue(mockValidationResult);

    // Setup mock for verification failure - scoring failure
    const verificationError = new Error('分析結果の検証に失敗しました。異常値判定ができません。');
    verificationError.name = 'AnalysisResultVerificationFailureException';
    mockVerifyAndScoreAnalysisResult.mockRejectedValue(verificationError);

    // Setup mock for notifications
    const mockNotificationDeliveryRecord1: NotificationDeliveryRecord = {
      notificationId: 'notif-001',
      recipientType: 'field_leader',
      deliveryStatus: 'success',
      deliveryTimestamp: new Date().toISOString(),
    };
    const mockNotificationDeliveryRecord2: NotificationDeliveryRecord = {
      notificationId: 'notif-002',
      recipientType: 'administrator',
      deliveryStatus: 'success',
      deliveryTimestamp: new Date().toISOString(),
    };
    mockSendQualityValidationResultToFieldLeader.mockResolvedValue(
      mockNotificationDeliveryRecord1
    );
    mockSendAnalysisResultVerificationToManager.mockResolvedValue(
      mockNotificationDeliveryRecord2
    );

    // Construct aiClient matching Tx2Imp1AiClient interface
    const aiClient: Tx2Imp1AiClient = {
      executeDailyBatchProcess: mockExecuteDailyBatchProcess,
      validateAggregatedPerformanceData: mockValidateAggregatedPerformanceData,
      verifyAndScoreAnalysisResult: mockVerifyAndScoreAnalysisResult,
      sendQualityValidationResultToFieldLeader: mockSendQualityValidationResultToFieldLeader,
      sendAnalysisResultVerificationToManager: mockSendAnalysisResultVerificationToManager,
    };

    const input: Tx2Imp1AgentInput = {
      triggerType: 'scheduled',
      targetDate: '2024-01-15',
      executorUserId: 'user-001',
    };

    const output: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input, aiClient);

    // Verify executionStatus is 'partial_failure'
    expect(output.executionStatus).toBe('partial_failure');

    // Verify validationResult is not null and is returned
    expect(output.validationResult).not.toBeNull();
    expect(output.validationResult).toBeDefined();
    expect(output.validationResult?.validationStatus).toBe('passed');

    // Verify verificationResult is null
    expect(output.verificationResult).toBeNull();

    // Verify errorDetails contains the expected error message
    expect(output.errorDetails).not.toBeNull();
    expect(output.errorDetails).toBeDefined();
    if (output.errorDetails) {
      const errorFound = output.errorDetails.some(
        (err) =>
          err.errorMessage.includes('分析結果の検証に失敗しました') &&
          err.errorMessage.includes('異常値判定ができません')
      );
      expect(errorFound).toBe(true);
    }

    // Verify notificationsSent contains at least one record
    expect(output.notificationsSent).toBeDefined();
    expect(Array.isArray(output.notificationsSent)).toBe(true);
    expect(output.notificationsSent.length).toBeGreaterThanOrEqual(1);

    // Verify both notification functions were called
    expect(mockSendQualityValidationResultToFieldLeader).toHaveBeenCalled();
    expect(mockSendAnalysisResultVerificationToManager).toHaveBeenCalled();

    // Verify notificationsSent includes records from both notification functions
    const notificationIds = output.notificationsSent.map((n) => n.notificationId);
    expect(notificationIds).toContain('notif-001');
    expect(notificationIds).toContain('notif-002');

    // Verify all notification records have required properties
    output.notificationsSent.forEach((notification) => {
      expect(notification).toHaveProperty('notificationId');
      expect(notification).toHaveProperty('recipientType');
      expect(notification).toHaveProperty('deliveryStatus');
      expect(notification).toHaveProperty('deliveryTimestamp');
      expect(notification.deliveryStatus).toBe('success');
    });
  });
});