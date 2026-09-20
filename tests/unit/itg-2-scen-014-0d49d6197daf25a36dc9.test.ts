import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
  BatchAggregationResult,
  BatchAnalysisResult,
  DataQualityValidationResult,
  AnalysisVerificationResult,
  NotificationDeliveryRecord,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-014: 定時トリガーで正常に日次バッチが完了し、全ステップの結果を返す', () => {
  let mockExecuteDailyBatchProcess: jest.Mock;
  let mockValidateAggregatedPerformanceData: jest.Mock;
  let mockVerifyAndScoreAnalysisResult: jest.Mock;
  let mockSendQualityValidationResultToFieldLeader: jest.Mock;
  let mockSendAnalysisResultVerificationToManager: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockAggregationResult: BatchAggregationResult = {
      aggregatedRecordCount: 1500,
      aggregationPeriod: '2025-01-15',
      completenessScore: 98,
    };

    const mockAnalysisResult: BatchAnalysisResult = {
      analysisType: '生産性トレンド',
      keyFindings: [
        '過去7日間の生産性が平均110%で推移',
        'チームAの効率性が15%向上',
      ],
      recommendedActions: [
        'チームAの配置ルールを他チームに適用',
        'ボトルネック工程の人員追加配置を検討',
      ],
    };

    const mockValidationResult: DataQualityValidationResult = {
      validationStatus: 'passed',
      anomalousRecords: [],
      improvementGuidance: ['日次の定時入力を継続'],
    };

    const mockVerificationResult: AnalysisVerificationResult = {
      validityScore: 95,
      validityJudgment: 'valid',
      judgmentReason: '分析ロジックが標準手順に従い、結果が過去パターン範囲内',
      approvalRecommendation:
        '結果を基に現場リーダーへの配置指示を検討可能',
    };

    const mockFieldLeaderNotification: NotificationDeliveryRecord = {
      notificationId: 'notif-001',
      recipientType: 'field_leader',
      deliveryStatus: 'success',
      deliveryTimestamp: new Date().toISOString(),
    };

    const mockManagerNotification: NotificationDeliveryRecord = {
      notificationId: 'notif-002',
      recipientType: 'administrator',
      deliveryStatus: 'success',
      deliveryTimestamp: new Date().toISOString(),
    };

    mockExecuteDailyBatchProcess = jest.fn().mockResolvedValue({
      aggregationResult: mockAggregationResult,
      analysisResult: mockAnalysisResult,
    });

    mockValidateAggregatedPerformanceData = jest
      .fn()
      .mockResolvedValue(mockValidationResult);

    mockVerifyAndScoreAnalysisResult = jest
      .fn()
      .mockResolvedValue(mockVerificationResult);

    mockSendQualityValidationResultToFieldLeader = jest
      .fn()
      .mockResolvedValue(mockFieldLeaderNotification);

    mockSendAnalysisResultVerificationToManager = jest
      .fn()
      .mockResolvedValue(mockManagerNotification);
  });

  test('スケジュール トリガーで全ステップが成功し、結果を返す', async () => {
    const input: Tx2Imp1AgentInput = {
      triggerType: 'scheduled',
      targetDate: '2025-01-15',
      executorUserId: 'user-001',
    };

    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input, {
      executeDailyBatchProcess: mockExecuteDailyBatchProcess,
      validateAggregatedPerformanceData: mockValidateAggregatedPerformanceData,
      verifyAndScoreAnalysisResult: mockVerifyAndScoreAnalysisResult,
      sendQualityValidationResultToFieldLeader:
        mockSendQualityValidationResultToFieldLeader,
      sendAnalysisResultVerificationToManager:
        mockSendAnalysisResultVerificationToManager,
    });

    expect(result.executionStatus).toBe('success');

    expect(result.aggregationResult).not.toBeNull();
    expect(result.aggregationResult).toHaveProperty('aggregatedRecordCount');
    expect(result.aggregationResult).toHaveProperty('aggregationPeriod');
    expect(result.aggregationResult).toHaveProperty('completenessScore');

    expect(result.analysisResult).not.toBeNull();
    expect(result.analysisResult).toHaveProperty('analysisType');
    expect(result.analysisResult).toHaveProperty('keyFindings');
    expect(result.analysisResult).toHaveProperty('recommendedActions');

    expect(result.validationResult).not.toBeNull();
    expect(result.validationResult).toHaveProperty('validationStatus');
    expect(result.validationResult?.validationStatus).toBe('passed');
    expect(result.validationResult).toHaveProperty('anomalousRecords');
    expect(result.validationResult?.anomalousRecords).toHaveLength(0);

    expect(result.verificationResult).not.toBeNull();
    expect(result.verificationResult).toHaveProperty('validityScore');
    expect(result.verificationResult?.validityScore).toBeGreaterThanOrEqual(95);
    expect(result.verificationResult).toHaveProperty('validityJudgment');
    expect(result.verificationResult?.validityJudgment).toBe('valid');

    expect(result.notificationsSent).toBeDefined();
    expect(Array.isArray(result.notificationsSent)).toBe(true);
    expect(result.notificationsSent.length).toBeGreaterThanOrEqual(2);

    expect(mockSendQualityValidationResultToFieldLeader).toHaveBeenCalled();
    expect(mockSendAnalysisResultVerificationToManager).toHaveBeenCalled();

    const fieldLeaderNotifications = result.notificationsSent.filter(
      (n) => n.recipientType === 'field_leader'
    );
    const administratorNotifications = result.notificationsSent.filter(
      (n) => n.recipientType === 'administrator'
    );
    expect(fieldLeaderNotifications.length).toBeGreaterThanOrEqual(1);
    expect(administratorNotifications.length).toBeGreaterThanOrEqual(1);

    result.notificationsSent.forEach((notification) => {
      expect(notification.deliveryStatus).toBe('success');
      expect(notification.deliveryTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });

    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    expect(result.errorDetails).toBeNull();
  });

  test('入力パラメータが正しく処理される', async () => {
    const input: Tx2Imp1AgentInput = {
      triggerType: 'scheduled',
      targetDate: '2025-01-15',
      executorUserId: 'user-001',
    };

    await runTx2Imp1Agent(input, {
      executeDailyBatchProcess: mockExecuteDailyBatchProcess,
      validateAggregatedPerformanceData: mockValidateAggregatedPerformanceData,
      verifyAndScoreAnalysisResult: mockVerifyAndScoreAnalysisResult,
      sendQualityValidationResultToFieldLeader:
        mockSendQualityValidationResultToFieldLeader,
      sendAnalysisResultVerificationToManager:
        mockSendAnalysisResultVerificationToManager,
    });

    expect(mockExecuteDailyBatchProcess).toHaveBeenCalled();
  });

  test('集約結果、分析結果、検証結果がすべてレスポンスに含まれる', async () => {
    const input: Tx2Imp1AgentInput = {
      triggerType: 'scheduled',
      targetDate: '2025-01-15',
      executorUserId: 'user-001',
    };

    const result = await runTx2Imp1Agent(input, {
      executeDailyBatchProcess: mockExecuteDailyBatchProcess,
      validateAggregatedPerformanceData: mockValidateAggregatedPerformanceData,
      verifyAndScoreAnalysisResult: mockVerifyAndScoreAnalysisResult,
      sendQualityValidationResultToFieldLeader:
        mockSendQualityValidationResultToFieldLeader,
      sendAnalysisResultVerificationToManager:
        mockSendAnalysisResultVerificationToManager,
    });

    expect(result.aggregationResult?.aggregatedRecordCount).toBe(1500);
    expect(result.aggregationResult?.aggregationPeriod).toBe('2025-01-15');
    expect(result.analysisResult?.analysisType).toBe('生産性トレンド');
    expect(result.validationResult?.validationStatus).toBe('passed');
    expect(result.verificationResult?.validityJudgment).toBe('valid');
  });

  test('sendQualityValidationResultToFieldLeader と sendAnalysisResultVerificationToManager が呼び出され、その結果が notificationsSent に含まれる', async () => {
    const input: Tx2Imp1AgentInput = {
      triggerType: 'scheduled',
      targetDate: '2025-01-15',
      executorUserId: 'user-001',
    };

    const result = await runTx2Imp1Agent(input, {
      executeDailyBatchProcess: mockExecuteDailyBatchProcess,
      validateAggregatedPerformanceData: mockValidateAggregatedPerformanceData,
      verifyAndScoreAnalysisResult: mockVerifyAndScoreAnalysisResult,
      sendQualityValidationResultToFieldLeader:
        mockSendQualityValidationResultToFieldLeader,
      sendAnalysisResultVerificationToManager:
        mockSendAnalysisResultVerificationToManager,
    });

    expect(mockSendQualityValidationResultToFieldLeader).toHaveBeenCalled();
    expect(mockSendAnalysisResultVerificationToManager).toHaveBeenCalled();

    const fieldLeaderNotif = result.notificationsSent.find(
      (n) => n.notificationId === 'notif-001'
    );
    const managerNotif = result.notificationsSent.find(
      (n) => n.notificationId === 'notif-002'
    );

    expect(fieldLeaderNotif).toBeDefined();
    expect(fieldLeaderNotif?.recipientType).toBe('field_leader');
    expect(fieldLeaderNotif?.deliveryStatus).toBe('success');

    expect(managerNotif).toBeDefined();
    expect(managerNotif?.recipientType).toBe('administrator');
    expect(managerNotif?.deliveryStatus).toBe('success');
  });
});