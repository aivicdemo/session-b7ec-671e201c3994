import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-040: 手動トリガーで複数拠点の遅延リスクが検知され、対応拠点が特定される場合、複数の人員配置案と配置指示が生成・配信される', () => {
  it('should detect multiple delay risks, identify affected sites, generate multiple placement proposals, and deliver instructions when triggered manually with multiple target sites', async () => {
    // Arrange: 手動トリガー、実行ユーザーID、および複数拠点監視パラメータを設定
    const input: Tx4Imp1AgentInput = {
      triggerType: 'manual',
      executingUserId: 'user-001',
      targetSiteIds: ['site-001', 'site-002', 'site-003'],
      delayRiskThreshold: 70,
      monitoringIntervalSeconds: 300,
      contextData: {}
    };

    // Act: runTx4Imp1Agent関数を実行
    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authenticateUser: async (userId: string) => {
        if (userId === 'user-001') {
          return { authenticated: true, hasExecutionRight: true };
        }
        return { authenticated: false, hasExecutionRight: false };
      },
      monitorProgressAndDetectDelayRisk: async (siteIds: string[], threshold: number) => {
        return [
          {
            siteId: 'site-001',
            riskScore: 75,
            progressRate: 45,
            remainingTimeHours: 12,
            detectionTimestamp: new Date().toISOString()
          },
          {
            siteId: 'site-002',
            riskScore: 82,
            progressRate: 35,
            remainingTimeHours: 10,
            detectionTimestamp: new Date().toISOString()
          },
          {
            siteId: 'site-003',
            riskScore: 73,
            progressRate: 50,
            remainingTimeHours: 14,
            detectionTimestamp: new Date().toISOString()
          }
        ];
      },
      orchestrateDataCollectionForDelayRisk: async (risks: any[]) => {
        return [
          {
            siteId: 'site-001',
            siteName: '東京拠点',
            requiredAdjustments: ['人員増加'],
            currentTeamCapacity: 60,
            requiredCapacityIncrease: 25
          },
          {
            siteId: 'site-002',
            siteName: '大阪拠点',
            requiredAdjustments: ['人員増加', '優先度調整'],
            currentTeamCapacity: 55,
            requiredCapacityIncrease: 30
          }
        ];
      },
      judgePersonnelReallocationFeasibility: async (affectedSites: any[]) => {
        return {
          feasible: true,
          constraints: [],
          preliminaryProposals: []
        };
      },
      assessDeliveryRiskAndProposeAdjustments: async (affectedSites: any[]) => {
        return [
          {
            proposalId: 'proposal-001',
            targetSiteId: 'site-001',
            workerReallocationPlan: [
              {
                workerId: 'worker-101',
                workerName: '山田太郎',
                sourceSiteId: 'site-003',
                targetSiteId: 'site-001',
                assignedWorkType: '組立',
                skillMatchScore: 85,
                estimatedProductivityAtTarget: 92
              }
            ],
            expectedProductivityImprovement: 18,
            estimatedDeliveryRiskReduction: 22,
            proposalGeneratedTimestamp: new Date().toISOString()
          },
          {
            proposalId: 'proposal-002',
            targetSiteId: 'site-002',
            workerReallocationPlan: [
              {
                workerId: 'worker-102',
                workerName: '鈴木花子',
                sourceSiteId: 'site-003',
                targetSiteId: 'site-002',
                assignedWorkType: '検査',
                skillMatchScore: 80,
                estimatedProductivityAtTarget: 88
              },
              {
                workerId: 'worker-103',
                workerName: '田中一郎',
                sourceSiteId: 'site-001',
                targetSiteId: 'site-002',
                assignedWorkType: '梱包',
                skillMatchScore: 78,
                estimatedProductivityAtTarget: 85
              }
            ],
            expectedProductivityImprovement: 25,
            estimatedDeliveryRiskReduction: 28,
            proposalGeneratedTimestamp: new Date().toISOString()
          }
        ];
      },
      deliverPlacementInstructionToFieldLeader: async (proposals: any[]) => {
        return [
          {
            instructionId: 'instr-001',
            fieldLeaderId: 'leader-001',
            targetSiteId: 'site-001',
            deliveryStatus: 'delivered',
            deliveryTimestamp: new Date().toISOString(),
            acknowledgmentTimestamp: null
          },
          {
            instructionId: 'instr-002',
            fieldLeaderId: 'leader-002',
            targetSiteId: 'site-002',
            deliveryStatus: 'delivered',
            deliveryTimestamp: new Date().toISOString(),
            acknowledgmentTimestamp: null
          },
          {
            instructionId: 'instr-003',
            fieldLeaderId: 'leader-002',
            targetSiteId: 'site-002',
            deliveryStatus: 'delivered',
            deliveryTimestamp: new Date().toISOString(),
            acknowledgmentTimestamp: null
          }
        ];
      },
      sendProgressDelayRiskNotification: async () => {
        return { notificationSent: true };
      }
    });

    // Assert: 期待結果の検証
    expect(result.executionStatus).toBe('success');
    
    expect(result.detectedDelayRisks).toBeDefined();
    expect(result.detectedDelayRisks.length).toBeGreaterThanOrEqual(3);
    expect(result.detectedDelayRisks[0]).toHaveProperty('siteId');
    expect(result.detectedDelayRisks[0]).toHaveProperty('riskScore');
    expect(result.detectedDelayRisks[0]).toHaveProperty('progressRate');
    expect(result.detectedDelayRisks[0]).toHaveProperty('remainingTimeHours');
    expect(result.detectedDelayRisks[0]).toHaveProperty('detectionTimestamp');
    
    expect(result.affectedSites).toBeDefined();
    expect(result.affectedSites.length).toBeGreaterThanOrEqual(2);
    expect(result.affectedSites[0]).toHaveProperty('siteId');
    expect(result.affectedSites[0]).toHaveProperty('siteName');
    expect(result.affectedSites[0]).toHaveProperty('requiredAdjustments');
    expect(result.affectedSites[0]).toHaveProperty('currentTeamCapacity');
    expect(result.affectedSites[0]).toHaveProperty('requiredCapacityIncrease');
    
    expect(result.placementProposals).toBeDefined();
    expect(result.placementProposals.length).toBeGreaterThanOrEqual(2);
    result.placementProposals.forEach(proposal => {
      expect(proposal).toHaveProperty('proposalId');
      expect(proposal).toHaveProperty('targetSiteId');
      expect(proposal).toHaveProperty('workerReallocationPlan');
      expect(proposal.workerReallocationPlan.length).toBeGreaterThan(0);
      proposal.workerReallocationPlan.forEach(reallocation => {
        expect(reallocation).toHaveProperty('workerId');
        expect(reallocation).toHaveProperty('workerName');
        expect(reallocation).toHaveProperty('sourceSiteId');
        expect(reallocation).toHaveProperty('targetSiteId');
        expect(reallocation).toHaveProperty('skillMatchScore');
        expect(typeof reallocation.skillMatchScore).toBe('number');
        expect(reallocation.skillMatchScore).toBeGreaterThanOrEqual(0);
        expect(reallocation.skillMatchScore).toBeLessThanOrEqual(100);
      });
      expect(proposal).toHaveProperty('expectedProductivityImprovement');
      expect(proposal).toHaveProperty('estimatedDeliveryRiskReduction');
      expect(proposal).toHaveProperty('proposalGeneratedTimestamp');
    });
    
    expect(result.deliveryInstructions).toBeDefined();
    expect(result.deliveryInstructions.length).toBeGreaterThanOrEqual(result.placementProposals.length);
    result.deliveryInstructions.forEach(instruction => {
      expect(instruction).toHaveProperty('instructionId');
      expect(instruction).toHaveProperty('fieldLeaderId');
      expect(instruction).toHaveProperty('targetSiteId');
      expect(instruction).toHaveProperty('deliveryStatus');
      expect(['delivered', 'acknowledged', 'failed']).toContain(instruction.deliveryStatus);
      expect(instruction).toHaveProperty('deliveryTimestamp');
    });
    
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    expect(() => new Date(result.executionTimestamp)).not.toThrow();
    
    expect(result.errorDetails).toEqual(null);
  });
});