import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as progressModule from '../../src/logic/progress-monitoring';
import * as dataCollectionModule from '../../src/logic/data-collection-orchestration';
import * as personnelModule from '../../src/logic/personnel-reallocation-judgment';
import * as assessmentModule from '../../src/logic/assessment-delivery-risk-assessment';
import * as notificationModule from '../../src/logic/notification-and-integration';

describe('SCEN-034: スケジュール実行トリガーで進捗監視から配置指示配信まで完結', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggerType=scheduledで、進捗監視から遅延リスク検知、対応拠点特定、人員配置案生成、現場リーダーへの配置指示配信まで完結し、成功ステータスで出力される', async () => {
    // Step 1: 認可・認証のスタブ化
    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: 'user-001',
      isAuthorized: true,
    });

    // Step 3: 遅延リスク検知結果をスタブ化
    jest.spyOn(progressModule, 'monitorProgressAndDetectDelayRisk').mockResolvedValue([
      {
        siteId: 'site-A',
        progressRate: 60,
        remainingTimeHours: 8,
        riskScore: 75,
        detectionTimestamp: new Date().toISOString(),
      },
      {
        siteId: 'site-B',
        progressRate: 55,
        remainingTimeHours: 6,
        riskScore: 78,
        detectionTimestamp: new Date().toISOString(),
      },
    ]);

    // Step 4: データ収集完了をスタブ化
    jest.spyOn(dataCollectionModule, 'orchestrateDataCollectionForDelayRisk').mockResolvedValue({
      'site-A': {
        productivityData: { avgOutputPerHour: 45, qualityScore: 92 },
        skillMatchDegree: 85,
        personnelReallocationFeasibility: 'high',
      },
      'site-B': {
        productivityData: { avgOutputPerHour: 38, qualityScore: 88 },
        skillMatchDegree: 78,
        personnelReallocationFeasibility: 'medium',
      },
    });

    // Step 5: 人員融通判定をスタブ化
    jest.spyOn(personnelModule, 'judgePersonnelReallocationFeasibility').mockResolvedValue({
      'site-A': {
        availableCount: 3,
        skillMatchScore: 85,
        feasibility: 'high',
      },
      'site-B': {
        availableCount: 2,
        skillMatchScore: 78,
        feasibility: 'medium',
      },
    });

    // Step 6: 納期リスク軽減案をスタブ化
    jest.spyOn(assessmentModule, 'assessDeliveryRiskAndProposeAdjustments').mockResolvedValue({
      'site-A': {
        riskReductionRate: 60,
        estimatedDeliveryRisk: 15,
      },
      'site-B': {
        riskReductionRate: 72,
        estimatedDeliveryRisk: 22,
      },
    });

    // Step 7: 配置指示配信をスタブ化
    jest.spyOn(notificationModule, 'deliverPlacementInstructionToFieldLeader').mockResolvedValue([
      {
        instructionId: 'instr-001',
        fieldLeaderId: 'leader-001',
        targetSiteId: 'site-A',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
      },
      {
        instructionId: 'instr-002',
        fieldLeaderId: 'leader-002',
        targetSiteId: 'site-B',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
      },
    ]);

    // Step 2: エージェント実行
    const input = {
      triggerType: 'scheduled',
      delayRiskThreshold: 70,
      targetSiteIds: ['site-A', 'site-B'],
      executingUserId: 'user-001',
      contextData: { 受注優先度: '高' },
    };

    const output = await runTx4Imp1Agent(input, {
      authenticateUser: authModule.authenticateUser,
      monitorProgressAndDetectDelayRisk: progressModule.monitorProgressAndDetectDelayRisk,
      orchestrateDataCollectionForDelayRisk: dataCollectionModule.orchestrateDataCollectionForDelayRisk,
      judgePersonnelReallocationFeasibility: personnelModule.judgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: assessmentModule.assessDeliveryRiskAndProposeAdjustments,
      deliverPlacementInstructionToFieldLeader: notificationModule.deliverPlacementInstructionToFieldLeader,
    });

    // Step 8: 出力検証
    expect(output.executionStatus).toBe('success');
    
    expect(output.detectedDelayRisks).toHaveLength(2);
    expect(output.detectedDelayRisks[0]).toMatchObject({
      siteId: 'site-A',
      riskScore: 75,
      progressRate: 60,
      remainingTimeHours: 8,
    });
    expect(output.detectedDelayRisks[1]).toMatchObject({
      siteId: 'site-B',
      riskScore: 78,
      progressRate: 55,
      remainingTimeHours: 6,
    });

    expect(output.affectedSites).toHaveLength(2);
    expect(output.affectedSites.map((s) => s.siteId)).toEqual(['site-A', 'site-B']);

    expect(output.placementProposals).toHaveLength(2);
    expect(output.placementProposals[0]).toMatchObject({
      targetSiteId: 'site-A',
      expectedProductivityImprovement: expect.any(Number),
      estimatedDeliveryRiskReduction: expect.any(Number),
    });
    expect(output.placementProposals[0].workerReallocationPlan).toHaveLength(3);
    expect(output.placementProposals[1]).toMatchObject({
      targetSiteId: 'site-B',
    });
    expect(output.placementProposals[1].workerReallocationPlan).toHaveLength(2);

    expect(output.deliveryInstructions).toHaveLength(2);
    expect(output.deliveryInstructions[0]).toMatchObject({
      fieldLeaderId: 'leader-001',
      targetSiteId: 'site-A',
      deliveryStatus: 'delivered',
      deliveryTimestamp: expect.any(String),
    });
    expect(output.deliveryInstructions[1]).toMatchObject({
      fieldLeaderId: 'leader-002',
      targetSiteId: 'site-B',
      deliveryStatus: 'delivered',
      deliveryTimestamp: expect.any(String),
    });

    expect(output.executionTimestamp).toBeDefined();
    expect(() => new Date(output.executionTimestamp)).not.toThrow();

    expect(output.errorDetails).toBeNull();
  });
});