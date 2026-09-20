import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
  BatchAggregationResult,
  BatchAnalysisResult,
  DataQualityValidationResult,
  AnalysisVerificationResult,
  NotificationDeliveryRecord,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-022: 手動トリガーで正常に日次バッチが完了し、全ステップの結果を返す', () => {
  it('should complete daily batch processing successfully with manual trigger and return all step results', async () => {
    // Arrange: mock data for BatchAggregationResult
    const mockAggregationResult: BatchAggregationResult = {
      aggregatedRecordCount: 150,
      aggregationPeriod: '2025-01-15',
      completenessScore: 95,
    };

    // mock data for BatchAnalysisResult
    const mockAnalysisResult: BatchAnalysisResult = {
      analysisType: '生産性トレンド',
      keyFindings: [
        '拠点Aの生産性が5%低下',
        'チームBの品質スコアが向上',
      ],
      recommendedActions: [
        '拠点Aへの人員配置見直しを検討',
        'チームBの成功事例を他拠点に展開',
      ],
    };

    // mock data for DataQualityValidationResult
    const mockValidationResult: DataQualityValidationResult = {
      validationStatus: 'passed',
      anomalousRecords: [],
      improvementGuidance: [
        'データ入力精度を維持',
      ],
    };

    // mock data for AnalysisVerificationResult
    const mockVerificationResult: AnalysisVerificationResult = {
      validityScore: 92,
      validityJudgment: 'valid',
      judgmentReason: '分析結果は過去データとの一貫性が確認され、統計的に妥当',
      approvalRecommendation: '管理者による承認を推奨。現場への配置指示配信を実施',
    };

    // mock data for NotificationDeliveryRecords
    const mockNotifications: NotificationDeliveryRecord[] = [
      {
        notificationId: 'notif-001',
        recipientType: 'field_leader',
        deliveryStatus: 'success',
        deliveryTimestamp: '2025-01-15T09:00:00Z',
      },
      {
        notificationId: 'notif-002',
        recipientType: 'administrator',
        deliveryStatus: 'success',
        deliveryTimestamp: '2025-01-15T09:01:00Z',
      },
    ];

    const executionTimestamp = '2025-01-15T09:02:00Z';

    // Act: Call the agent with manual trigger input and mock dependencies
    const input: Tx2Imp1AgentInput = {
      triggerType: 'manual',
      targetDate: '2025-01-15',
      executorUserId: 'user-001',
    };

    const result = await runTx2Imp1Agent(input, {
      executeDailyBatchProcess: jest.fn().mockResolvedValue({
        aggregationResult: mockAggregationResult,
        analysisResult: mockAnalysisResult,
        validationResult: mockValidationResult,
        verificationResult: mockVerificationResult,
      }),
      validateAggregatedPerformanceData: jest.fn().mockResolvedValue(mockValidationResult),
      verifyAndScoreAnalysisResult: jest.fn().mockResolvedValue(mockVerificationResult),
      sendQualityValidationResultToFieldLeader: jest.fn().mockResolvedValue(mockNotifications[0]),
      sendAnalysisResultVerificationToManager: jest.fn().mockResolvedValue(mockNotifications[1]),
    });

    // Assert: Verify all expected results
    expect(result.executionStatus).toBe('success');
    expect(result.aggregationResult).not.toBeNull();
    expect(result.aggregationResult).toEqual(mockAggregationResult);
    expect(result.analysisResult).not.toBeNull();
    expect(result.analysisResult).toEqual(mockAnalysisResult);
    expect(result.validationResult).not.toBeNull();
    expect(result.validationResult).toEqual(mockValidationResult);
    expect(result.verificationResult).not.toBeNull();
    expect(result.verificationResult).toEqual(mockVerificationResult);
    expect(result.notificationsSent).toHaveLength(2);
    expect(result.notificationsSent).toEqual(mockNotifications);
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.errorDetails).toBeNull();
  });
});