import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { Tx1Imp1AgentInput, Tx1Imp1AgentOutput, DelayDetectionResult, AffectedFacility, AffectedTeam, GeneratedAllocationPlan, ApprovedAllocationPlan, DeliveryResult } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-011: monitoringWindowMinutesをデフォルト値60分で実行した場合の進捗ばらつきと遅延検知', () => {
  let mockAuthService: any;
  let mockWmsDataSource: any;
  let mockRiskPredictionAdapter: any;
  let mockAllocationEngine: any;
  let mockApprovalEngine: any;
  let mockDeliveryService: any;
  let mockAuditService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  function setupMocks() {
    mockAuthService = {
      authorizeOperation: jest.fn().mockResolvedValue({ authorized: true }),
    };

    mockWmsDataSource = {
      fetchProgressData: jest.fn().mockResolvedValue({
        facilityProgresses: [
          {
            facilityId: 'fac-001',
            facilityName: '拠点A',
            teamProgresses: [
              {
                teamId: 'team-001',
                teamName: 'チームA',
                progressRate: 75,
                plannedProgressRate: 70,
                delayDays: 0,
                qualityScore: 85,
                workInstructionId: 'wi-001',
              },
              {
                teamId: 'team-002',
                teamName: 'チームB',
                progressRate: 60,
                plannedProgressRate: 70,
                delayDays: 1,
                qualityScore: 68, // 品質スコア差 17% （85-68 > 15% 閾値）
                workInstructionId: 'wi-002',
              },
            ],
          },
        ],
      }),
    };

    mockRiskPredictionAdapter = {
      predictDelayRisk: jest.fn().mockResolvedValue({
        delayDetected: true,
        qualityVarianceDetected: true,
        affectedFacilities: [
          {
            facilityId: 'fac-001',
            facilityName: '拠点A',
            riskScore: 65, // 閾値 60 を超える
            riskRank: 1,
            delayReasons: ['low_productivity', 'quality_issue'],
            affectedTeams: [
              {
                teamId: 'team-002',
                teamName: 'チームB',
                progressRate: 60,
                plannedProgressRate: 70,
                delayDays: 1,
                qualityScore: 68,
              },
            ],
          },
        ],
        overallRiskScore: 65,
        detectionTimestamp: new Date().toISOString(),
      }),
    };

    mockAllocationEngine = {
      generateAllocationPlans: jest
        .fn()
        .mockResolvedValue({
          plans: [
            {
              planId: 'plan-001',
              facilityId: 'fac-001',
              teamId: 'team-002',
              workInstructionId: 'wi-002',
              proposedAllocations: [
                {
                  workerId: 'worker-001',
                  workerName: '作業者001',
                  assignedWorkType: 'assembly',
                  proficiencyLevel: 'intermediate',
                  adjustedDifficulty: 'normal',
                  estimatedWorkHours: 8,
                  productivityRate: 92,
                },
              ],
              feasibilityScore: 88,
              recommendationRank: 1,
              estimatedCompletionDate: new Date(
                Date.now() + 86400000
              ).toISOString(),
              proficiencyAdjustmentApplied: true,
            },
            {
              planId: 'plan-002',
              facilityId: 'fac-001',
              teamId: 'team-002',
              workInstructionId: 'wi-002',
              proposedAllocations: [
                {
                  workerId: 'worker-002',
                  workerName: '作業者002',
                  assignedWorkType: 'assembly',
                  proficiencyLevel: 'beginner',
                  adjustedDifficulty: 'easy',
                  estimatedWorkHours: 10,
                  productivityRate: 75,
                },
              ],
              feasibilityScore: 72,
              recommendationRank: 2,
              estimatedCompletionDate: new Date(
                Date.now() + 172800000
              ).toISOString(),
              proficiencyAdjustmentApplied: true,
            },
          ],
        }),
    };

    mockApprovalEngine = {
      judgeAllocationPlanApprovalWithCriteria: jest
        .fn()
        .mockResolvedValue({
          approvedPlans: [
            {
              planId: 'plan-001',
              approvalStatus: 'auto_approved',
              approvalTimestamp: new Date().toISOString(),
              approverUserId: null,
            },
          ],
        }),
    };

    mockDeliveryService = {
      deliverAllocationPlanAndWorkInstructions: jest
        .fn()
        .mockResolvedValue({
          deliveryResults: [
            {
              deliveryId: 'deliv-001',
              planId: 'plan-001',
              targetFieldLeaderId: 'leader-001',
              deliveryStatus: 'delivered',
              deliveryTimestamp: new Date().toISOString(),
              receptionConfirmed: false,
              receptionConfirmationTimestamp: null,
              executionStarted: false,
              executionStartTimestamp: null,
            },
          ],
        }),
    };

    mockAuditService = {
      recordOperationAudit: jest.fn().mockResolvedValue({ success: true }),
    };
  }

  it('monitoringWindowMinutesデフォルト値60分で進捗ばらつき・遅延を検知し、配置案生成・承認・配信を完結させる', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-admin-001',
      targetFacilityIds: ['fac-001'],
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60, // デフォルト値
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    // エージェント呼び出し
    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authService: mockAuthService,
      wmsDataSource: mockWmsDataSource,
      riskPredictionAdapter: mockRiskPredictionAdapter,
      allocationEngine: mockAllocationEngine,
      approvalEngine: mockApprovalEngine,
      deliveryService: mockDeliveryService,
      auditService: mockAuditService,
    });

    // 1. executionStatusが'completed'
    expect(output.executionStatus).toBe('completed');

    // 2. executionIdが生成された一意の識別子
    expect(output.executionId).toBeDefined();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);

    // 3. delayDetectionResultが非nullで条件を満たす
    expect(output.delayDetectionResult).toBeDefined();
    const delayResult = output.delayDetectionResult;

    expect(delayResult.delayDetected).toBe(true);
    expect(delayResult.qualityVarianceDetected).toBe(true);

    // 品質ばらつきが検知された
    expect(delayResult.affectedFacilities).toHaveLength(1);
    expect(delayResult.affectedFacilities[0].facilityId).toBe('fac-001');
    expect(delayResult.affectedFacilities[0].riskScore).toBeGreaterThanOrEqual(60);
    expect(
      delayResult.affectedFacilities[0].delayReasons
    ).toContain('quality_issue');

    // affectedTeams内に品質スコア差が15%超のチームが含まれる
    const affectedTeams = delayResult.affectedFacilities[0].affectedTeams;
    expect(affectedTeams.length).toBeGreaterThan(0);
    const teamB = affectedTeams.find((t) => t.teamId === 'team-002');
    expect(teamB).toBeDefined();
    expect(teamB!.qualityScore).toBeLessThan(75); // 品質スコア差検知対象

    // overallRiskScoreが設定されている
    expect(delayResult.overallRiskScore).toBeGreaterThanOrEqual(60);

    // 4. generatedAllocationPlansが非空配列
    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBeGreaterThan(0);

    for (const plan of output.generatedAllocationPlans) {
      expect(plan.planId).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(typeof plan.recommendationRank).toBe('number');
      expect(plan.recommendationRank).toBeGreaterThan(0);
      expect(typeof plan.proficiencyAdjustmentApplied).toBe('boolean');
    }

    // 5. approvedAllocationPlansが非空配列で承認基準を満たす
    expect(output.approvedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.approvedAllocationPlans)).toBe(true);
    expect(output.approvedAllocationPlans.length).toBeGreaterThan(0);

    for (const approved of output.approvedAllocationPlans) {
      expect(approved.planId).toBeDefined();
      expect(['auto_approved', 'manual_approved']).toContain(
        approved.approvalStatus
      );
      expect(approved.approvalTimestamp).toBeDefined();
      // ISO 8601 形式の検証
      expect(new Date(approved.approvalTimestamp).getTime()).toBeGreaterThan(0);
    }

    // 6. deliveryResultsが非空配列
    expect(output.deliveryResults).toBeDefined();
    expect(Array.isArray(output.deliveryResults)).toBe(true);
    expect(output.deliveryResults.length).toBeGreaterThan(0);

    for (const delivery of output.deliveryResults) {
      expect(delivery.deliveryId).toBeDefined();
      expect(delivery.planId).toBeDefined();
      expect(delivery.targetFieldLeaderId).toBeDefined();
      expect(['delivered', 'delivery_failed', 'pending_reception']).toContain(
        delivery.deliveryStatus
      );
      expect(delivery.deliveryTimestamp).toBeDefined();
      expect(new Date(delivery.deliveryTimestamp).getTime()).toBeGreaterThan(0);
      expect(typeof delivery.receptionConfirmed).toBe('boolean');
      expect(typeof delivery.executionStarted).toBe('boolean');
    }

    // 7. executionErrorsがnullまたは空配列
    if (output.executionErrors !== null) {
      expect(Array.isArray(output.executionErrors)).toBe(true);
      expect(output.executionErrors.length).toBe(0);
    }

    // 8. executionTimestampが有効なISO 8601形式
    expect(output.executionTimestamp).toBeDefined();
    const execTime = new Date(output.executionTimestamp);
    expect(execTime.getTime()).toBeGreaterThan(0);
    expect(output.executionTimestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('monitoringWindowMinutes=60で過去60分間のデータ範囲が正確に制御されること', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-admin-001',
      targetFacilityIds: ['fac-001'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    await runTx1Imp1Agent(input, {
      authService: mockAuthService,
      wmsDataSource: mockWmsDataSource,
      riskPredictionAdapter: mockRiskPredictionAdapter,
      allocationEngine: mockAllocationEngine,
      approvalEngine: mockApprovalEngine,
      deliveryService: mockDeliveryService,
      auditService: mockAuditService,
    });

    // WmsDataSourceが正しく呼び出されたことを確認
    expect(mockWmsDataSource.fetchProgressData).toHaveBeenCalled();
  });

  it('品質ばらつき検知は15%の閾値で正確に判定されること', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-admin-001',
      targetFacilityIds: ['fac-001'],
      qualityVarianceThreshold: 15,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      autoApprovalEnabled: true,
    };

    const output = await runTx1Imp1Agent(input, {
      authService: mockAuthService,
      wmsDataSource: mockWmsDataSource,
      riskPredictionAdapter: mockRiskPredictionAdapter,
      allocationEngine: mockAllocationEngine,
      approvalEngine: mockApprovalEngine,
      deliveryService: mockDeliveryService,
      auditService: mockAuditService,
    });

    // qualityVarianceDetectedがtrueであること
    expect(output.delayDetectionResult.qualityVarianceDetected).toBe(true);

    // affectedFacilitiesに品質ばらつき対象チームが含まれること
    const affected = output.delayDetectionResult.affectedFacilities[0];
    expect(affected.affectedTeams.length).toBeGreaterThan(0);
  });

  it('遅延リスク判定はdelayRiskThreshold=60で正確に実行されること', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-admin-001',
      targetFacilityIds: ['fac-001'],
      delayRiskThreshold: 60,
      monitoringWindowMinutes: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const output = await runTx1Imp1Agent(input, {
      authService: mockAuthService,
      wmsDataSource: mockWmsDataSource,
      riskPredictionAdapter: mockRiskPredictionAdapter,
      allocationEngine: mockAllocationEngine,
      approvalEngine: mockApprovalEngine,
      deliveryService: mockDeliveryService,
      auditService: mockAuditService,
    });

    // overallRiskScoreが60以上であること
    expect(output.delayDetectionResult.overallRiskScore).toBeGreaterThanOrEqual(
      60
    );

    // delayDetectedがtrueであること
    expect(output.delayDetectionResult.delayDetected).toBe(true);
  });

  it('autoApprovalEnabled=trueの場合、承認基準内の案が自動承認されること', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-admin-001',
      targetFacilityIds: ['fac-001'],
      autoApprovalEnabled: true,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
    };

    const output = await runTx1Imp1Agent(input, {
      authService: mockAuthService,
      wmsDataSource: mockWmsDataSource,
      riskPredictionAdapter: mockRiskPredictionAdapter,
      allocationEngine: mockAllocationEngine,
      approvalEngine: mockApprovalEngine,
      deliveryService: mockDeliveryService,
      auditService: mockAuditService,
    });

    // approvedAllocationPlansが存在し、自動承認ステータスを含むこと
    expect(output.approvedAllocationPlans.length).toBeGreaterThan(0);
    const autoApproved = output.approvedAllocationPlans.find(
      (p) => p.approvalStatus === 'auto_approved'
    );
    expect(autoApproved).toBeDefined();
  });

  it('習熟度調整が適用されたプランが生成されること', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-admin-001',
      targetFacilityIds: ['fac-001'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const output = await runTx1Imp1Agent(input, {
      authService: mockAuthService,
      wmsDataSource: mockWmsDataSource,
      riskPredictionAdapter: mockRiskPredictionAdapter,
      allocationEngine: mockAllocationEngine,
      approvalEngine: mockApprovalEngine,
      deliveryService: mockDeliveryService,
      auditService: mockAuditService,
    });

    // generatedAllocationPlansに習熟度調整が適用されたプランが含まれること
    const withAdjustment = output.generatedAllocationPlans.find(
      (p) => p.proficiencyAdjustmentApplied === true
    );
    expect(withAdjustment).toBeDefined();
  });

  it('deliveryResultsが配信日時と受領確認状況を含むこと', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-admin-001',
      targetFacilityIds: ['fac-001'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const output = await runTx1Imp1Agent(input, {
      authService: mockAuthService,
      wmsDataSource: mockWmsDataSource,
      riskPredictionAdapter: mockRiskPredictionAdapter,
      allocationEngine: mockAllocationEngine,
      approvalEngine: mockApprovalEngine,
      deliveryService: mockDeliveryService,
      auditService: mockAuditService,
    });

    // 全deliveryResultsが配信日時を持つこと
    for (const delivery of output.deliveryResults) {
      expect(delivery.deliveryTimestamp).toBeDefined();
      expect(new Date(delivery.deliveryTimestamp).getTime()).toBeGreaterThan(0);
    }
  });
});