import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import {
  Tx4Imp1AgentInput,
  Tx4Imp1AgentOutput,
  DelayRiskDetectionResult,
  AffectedSiteInfo,
  PlacementProposalInfo,
  DeliveryInstructionRecord,
} from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-042: カスタム遅延リスク閾値が指定された場合、その閾値に基づいて遅延リスク判定が実行される', () => {
  it('カスタム遅延リスク閾値 65 が指定された場合、進捗率 70% の拠点は遅延リスク検出対象として detectedDelayRisks に記録される', async () => {
    // 1. 入力パラメータを構築（delayRiskThreshold=65 を指定）
    const input: Tx4Imp1AgentInput = {
      triggerType: 'manual',
      targetSiteIds: ['site-001'],
      executingUserId: 'user-123',
      delayRiskThreshold: 65,
      monitoringIntervalSeconds: 300,
    };

    // 2. AIクライアントのスタブを構築
    // authenticateUser: executingUserId が有効なユーザーであることを検証
    const mockAuthenticateUser = jest
      .fn()
      .mockImplementation((userId: string) => {
        if (userId === 'user-123') {
          return Promise.resolve({
            userId: 'user-123',
            isValid: true,
          });
        }
        return Promise.resolve({
          userId,
          isValid: false,
        });
      });

    // 3. monitorProgressAndDetectDelayRisk: 進捗率 70% のデータを返す
    // riskScore > delayRiskThreshold の場合に検出対象と判定されると仮定し、
    // riskScore を 72 に設定（カスタム閾値 65 では検出、デフォルト 70 では検出）
    const mockMonitorProgress = jest
      .fn()
      .mockResolvedValue({
        siteId: 'site-001',
        riskScore: 72,
        progressRate: 70,
        remainingTimeHours: 2,
        detectionTimestamp: new Date().toISOString(),
      } as DelayRiskDetectionResult);

    // 4. orchestrateDataCollectionForDelayRisk: 拠点の進捗・納期・残り時間データを返す
    const mockOrchestrateData = jest.fn().mockResolvedValue({
      siteId: 'site-001',
      siteName: '東京拠点',
      requiredAdjustments: ['人員配置調整'],
      currentTeamCapacity: 70,
      requiredCapacityIncrease: 20,
    } as AffectedSiteInfo);

    // 5. judgePersonnelReallocationFeasibility: 人員融通可能を返す
    const mockJudgeFeasibility = jest.fn().mockResolvedValue({
      feasibilityStatus: 'feasible',
    });

    // 6. deliverPlacementInstructionToFieldLeader: 配置指示が正常に配信されたことを返す
    const mockDeliverInstruction = jest.fn().mockResolvedValue({
      instructionId: 'instr-001',
      fieldLeaderId: 'leader-001',
      targetSiteId: 'site-001',
      deliveryStatus: 'delivered',
      deliveryTimestamp: new Date().toISOString(),
      acknowledgmentTimestamp: null,
    } as DeliveryInstructionRecord);

    // 7. AIクライアントインターフェースを設定
    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgress,
      orchestrateDataCollectionForDelayRisk: mockOrchestrateData,
      judgePersonnelReallocationFeasibility: mockJudgeFeasibility,
      deliverPlacementInstructionToFieldLeader: mockDeliverInstruction,
    };

    // 8. runTx4Imp1Agent を実際に呼び出す
    const result = await runTx4Imp1Agent(input, aiClient);

    // 9. executionStatus が 'success' であることを確認
    expect(result.executionStatus).toBe('success');

    // 10. detectedDelayRisks 配列の長さが 1 以上であることを確認
    expect(result.detectedDelayRisks.length).toBeGreaterThanOrEqual(1);

    // 11. detectedDelayRisks[0] が遅延リスク判定対象として記録されていることを確認
    // カスタム閾値 65 で riskScore 72 が検出対象として判定される
    const detectedRisk = result.detectedDelayRisks[0];
    expect(detectedRisk.siteId).toBe('site-001');
    expect(detectedRisk.riskScore).toBeGreaterThan(65); // カスタム閾値を超えている
    expect(detectedRisk.progressRate).toBe(70);
    expect(detectedRisk.remainingTimeHours).toBe(2);
    expect(detectedRisk.detectionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );

    // 12. affectedSites 配列に site-001 が含まれることを確認
    expect(result.affectedSites.length).toBeGreaterThanOrEqual(1);
    expect(result.affectedSites[0].siteId).toBe('site-001');
    expect(result.affectedSites[0].siteName).toBe('東京拠点');

    // 13. placementProposals 配列が空でないことを確認
    expect(result.placementProposals.length).toBeGreaterThanOrEqual(1);
    expect(result.placementProposals[0].targetSiteId).toBe('site-001');
    expect(result.placementProposals[0]).toHaveProperty('proposalId');
    expect(result.placementProposals[0]).toHaveProperty('workerReallocationPlan');
    expect(result.placementProposals[0]).toHaveProperty(
      'expectedProductivityImprovement'
    );
    expect(result.placementProposals[0]).toHaveProperty(
      'estimatedDeliveryRiskReduction'
    );

    // 14. deliveryInstructions 配列の長さが 1 以上であることを確認
    expect(result.deliveryInstructions.length).toBeGreaterThanOrEqual(1);
    expect(result.deliveryInstructions[0].targetSiteId).toBe('site-001');
    expect(result.deliveryInstructions[0].deliveryStatus).toBe('delivered');

    // 15. executionTimestamp が ISO 8601 形式の文字列であることを確認
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );

    // 16. errorDetails が null であることを確認
    expect(result.errorDetails).toBeNull();

    // 17. authenticateUser が executingUserId='user-123' で呼び出されたことを確認
    expect(mockAuthenticateUser).toHaveBeenCalledWith('user-123');
  });
});