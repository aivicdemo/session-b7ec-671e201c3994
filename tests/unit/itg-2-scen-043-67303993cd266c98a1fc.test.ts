import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

jest.mock('../../src/agents/tx-4-imp-1/actions/monitor-progress-and-detect-delay-risk');
jest.mock('../../src/agents/tx-4-imp-1/actions/orchestrate-data-collection-for-delay-risk');
jest.mock('../../src/agents/tx-4-imp-1/actions/judge-personnel-reallocation-feasibility');
jest.mock('../../src/agents/tx-4-imp-1/actions/assess-delivery-risk-and-propose-adjustments');
jest.mock('../../src/agents/tx-4-imp-1/actions/deliver-placement-instruction-to-field-leader');
jest.mock('../../src/agents/tx-4-imp-1/actions/authenticate-user');

import * as monitorProgressModule from '../../src/agents/tx-4-imp-1/actions/monitor-progress-and-detect-delay-risk';
import * as orchestrateDataCollectionModule from '../../src/agents/tx-4-imp-1/actions/orchestrate-data-collection-for-delay-risk';
import * as judgePersonnelModule from '../../src/agents/tx-4-imp-1/actions/judge-personnel-reallocation-feasibility';
import * as assessDeliveryRiskModule from '../../src/agents/tx-4-imp-1/actions/assess-delivery-risk-and-propose-adjustments';
import * as deliverPlacementModule from '../../src/agents/tx-4-imp-1/actions/deliver-placement-instruction-to-field-leader';
import * as authenticateUserModule from '../../src/agents/tx-4-imp-1/actions/authenticate-user';

describe('SCEN-043: 追加コンテキスト情報が入力されて実行される場合、その情報が配置案生成の判断に反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('contextDataが各処理に伝播し、配置案生成に反映される', async () => {
    const contextData = {
      key1: 'value1',
      key2: 'value2',
      priority: 'high',
      businessUnit: 'manufacturing',
    };

    const mockAuthResult = {
      authenticated: true,
      userId: 'user123',
      permissions: ['execute_agent'],
    };

    const mockDelayRiskResult = {
      siteId: 'site-001',
      riskScore: 75,
      progressRate: 45,
      remainingTimeHours: 10,
      detectionTimestamp: new Date().toISOString(),
    };

    const mockDataCollectionResult = {
      siteId: 'site-001',
      siteName: 'Tokyo Manufacturing',
      requiredAdjustments: ['increase_workforce', 'optimize_schedule'],
      currentTeamCapacity: 60,
      requiredCapacityIncrease: 25,
    };

    const mockPersonnelFeasibilityResult = {
      feasible: true,
      availableWorkersCount: 3,
      estimatedLeadTime: 15,
    };

    const mockDeliveryRiskAssessmentResult = {
      proposals: [
        {
          proposalId: 'proposal-001',
          targetSiteId: 'site-001',
          workerReallocationPlan: [
            {
              workerId: 'worker-001',
              workerName: 'Tanaka Hanako',
              sourceSiteId: 'site-002',
              targetSiteId: 'site-001',
              assignedWorkType: 'assembly',
              skillMatchScore: 85,
              estimatedProductivityAtTarget: 90,
            },
          ],
          expectedProductivityImprovement: 22,
          estimatedDeliveryRiskReduction: 18,
          proposalGeneratedTimestamp: new Date().toISOString(),
        },
      ],
    };

    const mockDeliveryInstructions = [
      {
        instructionId: 'instr-001',
        fieldLeaderId: 'leader-001',
        targetSiteId: 'site-001',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        acknowledgmentTimestamp: null,
      },
    ];

    (authenticateUserModule.authenticateUser as jest.Mock).mockResolvedValue(mockAuthResult);
    (monitorProgressModule.monitorProgressAndDetectDelayRisk as jest.Mock).mockResolvedValue([mockDelayRiskResult]);
    (orchestrateDataCollectionModule.orchestrateDataCollectionForDelayRisk as jest.Mock).mockResolvedValue([mockDataCollectionResult]);
    (judgePersonnelModule.judgePersonnelReallocationFeasibility as jest.Mock).mockResolvedValue(mockPersonnelFeasibilityResult);
    (assessDeliveryRiskModule.assessDeliveryRiskAndProposeAdjustments as jest.Mock).mockResolvedValue(mockDeliveryRiskAssessmentResult);
    (deliverPlacementModule.deliverPlacementInstructionToFieldLeader as jest.Mock).mockResolvedValue(mockDeliveryInstructions);

    const input: Tx4Imp1AgentInput = {
      triggerType: 'manual',
      executingUserId: 'user123',
      delayRiskThreshold: 70,
      contextData,
    };

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      monitorProgressAndDetectDelayRisk: monitorProgressModule.monitorProgressAndDetectDelayRisk,
      orchestrateDataCollectionForDelayRisk: orchestrateDataCollectionModule.orchestrateDataCollectionForDelayRisk,
      judgePersonnelReallocationFeasibility: judgePersonnelModule.judgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: assessDeliveryRiskModule.assessDeliveryRiskAndProposeAdjustments,
      deliverPlacementInstructionToFieldLeader: deliverPlacementModule.deliverPlacementInstructionToFieldLeader,
      authenticateUser: authenticateUserModule.authenticateUser,
    });

    expect(result.executionStatus).toBe('success');

    expect(result.detectedDelayRisks).toHaveLength(1);
    expect(result.detectedDelayRisks[0]).toMatchObject({
      siteId: 'site-001',
      riskScore: 75,
      progressRate: 45,
      remainingTimeHours: 10,
      detectionTimestamp: mockDelayRiskResult.detectionTimestamp,
    });

    expect(result.affectedSites).toHaveLength(1);
    expect(result.affectedSites[0]).toMatchObject({
      siteId: 'site-001',
      siteName: 'Tokyo Manufacturing',
      requiredAdjustments: ['increase_workforce', 'optimize_schedule'],
      currentTeamCapacity: 60,
      requiredCapacityIncrease: 25,
    });

    expect(result.placementProposals).toHaveLength(1);
    expect(result.placementProposals[0]).toBeDefined();
    expect(result.placementProposals[0].proposalId).toBe('proposal-001');

    expect(result.deliveryInstructions).toHaveLength(1);
    expect(result.deliveryInstructions[0].instructionId).toBe('instr-001');

    expect(orchestrateDataCollectionModule.orchestrateDataCollectionForDelayRisk).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData,
      })
    );

    expect(judgePersonnelModule.judgePersonnelReallocationFeasibility).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData,
      })
    );

    expect(assessDeliveryRiskModule.assessDeliveryRiskAndProposeAdjustments).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData,
      })
    );

    expect(deliverPlacementModule.deliverPlacementInstructionToFieldLeader).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData,
      })
    );
  });

  test('contextDataが複数の配置案に影響を与え、すべての指示に反映される', async () => {
    const contextData = {
      urgencyLevel: 'critical',
      clientName: 'SpecialClient',
      projectId: 'proj-2024-001',
    };

    const mockAuthResult = {
      authenticated: true,
      userId: 'user456',
      permissions: ['execute_agent'],
    };

    const mockDelayRiskResult = {
      siteId: 'site-003',
      riskScore: 85,
      progressRate: 30,
      remainingTimeHours: 5,
      detectionTimestamp: new Date().toISOString(),
    };

    const mockDataCollectionResult = {
      siteId: 'site-003',
      siteName: 'Osaka Distribution',
      requiredAdjustments: ['urgent_reallocation', 'priority_shift'],
      currentTeamCapacity: 50,
      requiredCapacityIncrease: 40,
    };

    const mockPersonnelFeasibilityResult = {
      feasible: true,
      availableWorkersCount: 5,
      estimatedLeadTime: 10,
    };

    const mockDeliveryRiskAssessmentResult = {
      proposals: [
        {
          proposalId: 'proposal-002',
          targetSiteId: 'site-003',
          workerReallocationPlan: [
            {
              workerId: 'worker-002',
              workerName: 'Suzuki Taro',
              sourceSiteId: 'site-004',
              targetSiteId: 'site-003',
              assignedWorkType: 'quality_check',
              skillMatchScore: 92,
              estimatedProductivityAtTarget: 95,
            },
            {
              workerId: 'worker-003',
              workerName: 'Ito Yuki',
              sourceSiteId: 'site-005',
              targetSiteId: 'site-003',
              assignedWorkType: 'packing',
              skillMatchScore: 78,
              estimatedProductivityAtTarget: 85,
            },
          ],
          expectedProductivityImprovement: 28,
          estimatedDeliveryRiskReduction: 25,
          proposalGeneratedTimestamp: new Date().toISOString(),
        },
      ],
    };

    const mockDeliveryInstructions = [
      {
        instructionId: 'instr-002',
        fieldLeaderId: 'leader-002',
        targetSiteId: 'site-003',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        acknowledgmentTimestamp: null,
      },
      {
        instructionId: 'instr-003',
        fieldLeaderId: 'leader-003',
        targetSiteId: 'site-003',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        acknowledgmentTimestamp: null,
      },
    ];

    (authenticateUserModule.authenticateUser as jest.Mock).mockResolvedValue(mockAuthResult);
    (monitorProgressModule.monitorProgressAndDetectDelayRisk as jest.Mock).mockResolvedValue([mockDelayRiskResult]);
    (orchestrateDataCollectionModule.orchestrateDataCollectionForDelayRisk as jest.Mock).mockResolvedValue([mockDataCollectionResult]);
    (judgePersonnelModule.judgePersonnelReallocationFeasibility as jest.Mock).mockResolvedValue(mockPersonnelFeasibilityResult);
    (assessDeliveryRiskModule.assessDeliveryRiskAndProposeAdjustments as jest.Mock).mockResolvedValue(mockDeliveryRiskAssessmentResult);
    (deliverPlacementModule.deliverPlacementInstructionToFieldLeader as jest.Mock).mockResolvedValue(mockDeliveryInstructions);

    const input: Tx4Imp1AgentInput = {
      triggerType: 'realtime_monitoring',
      executingUserId: 'user456',
      contextData,
    };

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      monitorProgressAndDetectDelayRisk: monitorProgressModule.monitorProgressAndDetectDelayRisk,
      orchestrateDataCollectionForDelayRisk: orchestrateDataCollectionModule.orchestrateDataCollectionForDelayRisk,
      judgePersonnelReallocationFeasibility: judgePersonnelModule.judgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: assessDeliveryRiskModule.assessDeliveryRiskAndProposeAdjustments,
      deliverPlacementInstructionToFieldLeader: deliverPlacementModule.deliverPlacementInstructionToFieldLeader,
      authenticateUser: authenticateUserModule.authenticateUser,
    });

    expect(result.executionStatus).toBe('success');

    expect(result.detectedDelayRisks).toHaveLength(1);
    expect(result.detectedDelayRisks[0].siteId).toBe('site-003');
    expect(result.detectedDelayRisks[0].riskScore).toBe(85);

    expect(result.affectedSites).toHaveLength(1);
    expect(result.affectedSites[0]).toMatchObject({
      siteId: 'site-003',
      siteName: 'Osaka Distribution',
      requiredAdjustments: ['urgent_reallocation', 'priority_shift'],
      currentTeamCapacity: 50,
      requiredCapacityIncrease: 40,
    });

    expect(result.placementProposals).toHaveLength(1);
    expect(result.placementProposals[0].workerReallocationPlan).toHaveLength(2);

    expect(result.deliveryInstructions).toHaveLength(2);

    result.deliveryInstructions.forEach((instruction) => {
      expect(instruction.deliveryStatus).toBe('delivered');
    });

    expect(orchestrateDataCollectionModule.orchestrateDataCollectionForDelayRisk).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData: expect.objectContaining({
          urgencyLevel: 'critical',
          clientName: 'SpecialClient',
          projectId: 'proj-2024-001',
        }),
      })
    );

    expect(judgePersonnelModule.judgePersonnelReallocationFeasibility).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData: expect.objectContaining({
          urgencyLevel: 'critical',
          clientName: 'SpecialClient',
          projectId: 'proj-2024-001',
        }),
      })
    );

    expect(assessDeliveryRiskModule.assessDeliveryRiskAndProposeAdjustments).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData: expect.objectContaining({
          urgencyLevel: 'critical',
          clientName: 'SpecialClient',
          projectId: 'proj-2024-001',
        }),
      })
    );

    expect(deliverPlacementModule.deliverPlacementInstructionToFieldLeader).toHaveBeenCalledWith(
      expect.objectContaining({
        contextData: expect.objectContaining({
          urgencyLevel: 'critical',
          clientName: 'SpecialClient',
          projectId: 'proj-2024-001',
        }),
      })
    );
  });
});