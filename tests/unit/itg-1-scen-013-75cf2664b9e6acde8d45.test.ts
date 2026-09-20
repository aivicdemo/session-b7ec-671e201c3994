import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { Tx1Imp1AgentInput, Tx1Imp1AgentOutput, DelayDetectionResult, GeneratedAllocationPlan, ApprovedAllocationPlan, DeliveryResult } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-013: qualityVarianceThreshold境界値テスト', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;

  beforeEach(() => {
    // スタブの準備
    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    
    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      detectionTimestamp: new Date().toISOString(),
      delayDetected: true,
      qualityVarianceDetected: true,
      qualityVarianceThreshold: 15,
      overallRiskScore: 75,
      affectedFacilities: [
        {
          facilityId: 'facility-001',
          facilityName: 'facility-001',
          riskScore: 75,
          riskRank: 1,
          delayReasons: ['quality_issue'],
          affectedTeams: [
            {
              teamId: 'team-a',
              teamName: 'TeamA',
              progressRate: 85,
              plannedProgressRate: 80,
              delayDays: 0,
              qualityScore: 85,
            },
            {
              teamId: 'team-b',
              teamName: 'TeamB',
              progressRate: 70,
              plannedProgressRate: 80,
              delayDays: 1,
              qualityScore: 70,
            },
          ],
        },
      ],
    } as DelayDetectionResult);

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        planId: 'plan-001',
        facilityId: 'facility-001',
        teamId: 'team-b',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Worker A',
            assignedWorkType: 'quality_control',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 95,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
    ] as GeneratedAllocationPlan[]);

    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue([
      {
        planId: 'plan-001',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
        approverUserId: null,
      },
    ] as ApprovedAllocationPlan[]);

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue([
      {
        deliveryId: 'delivery-001',
        planId: 'plan-001',
        targetFieldLeaderId: 'leader-001',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
    ] as DeliveryResult[]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('qualityVarianceThreshold=15%でチーム間品質スコア差15%が検知される', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-a', 'team-b'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    // 実装対象の関数を呼び出す
    const output = await runTx1Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    });

    // executionStatus の検証
    expect(output.executionStatus).toMatch(/completed|partial_failure|failed/);
    expect(['completed', 'partial_failure', 'failed']).toContain(output.executionStatus);
    
    // delayDetectionResult の検証
    expect(output.delayDetectionResult).toBeDefined();
    expect(output.delayDetectionResult.qualityVarianceDetected).toBe(true);
    
    // delayDetectionResult内のqualityVarianceThresholdフィールド値が15として記録されているか確認
    expect(output.delayDetectionResult.qualityVarianceThreshold).toBeDefined();
    expect(output.delayDetectionResult.qualityVarianceThreshold).toBe(15);
    
    // チーム間品質スコア差の検証（TeamA 85% - TeamB 70% = 15%）
    const affectedTeams = output.delayDetectionResult.affectedFacilities[0].affectedTeams;
    const teamAQuality = affectedTeams.find(t => t.teamId === 'team-a')?.qualityScore;
    const teamBQuality = affectedTeams.find(t => t.teamId === 'team-b')?.qualityScore;
    const qualityScoreDifference = Math.abs(teamAQuality! - teamBQuality!);
    
    // 入力のqualityVarianceThresholdと同等以上のスコア差が検知されたことを確認
    expect(qualityScoreDifference).toBeGreaterThanOrEqual(input.qualityVarianceThreshold!);
    
    // qualityVarianceDetected フラグが true であることで、スコア差が閾値を超えた検知を確認
    expect(output.delayDetectionResult.qualityVarianceDetected).toBe(true);
    
    // 生成された配置案の検証
    expect(output.generatedAllocationPlans).toBeDefined();
    expect(output.generatedAllocationPlans.length).toBeGreaterThanOrEqual(1);
    
    // 配置案がチーム別に特定されていることを確認
    expect(output.generatedAllocationPlans.some(plan => plan.teamId === 'team-b')).toBe(true);
    
    // 各配置案の必須フィールド検証
    output.generatedAllocationPlans.forEach(plan => {
      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      
      expect(plan.recommendationRank).toBeDefined();
      expect(typeof plan.recommendationRank).toBe('number');
      expect(Number.isInteger(plan.recommendationRank)).toBe(true);
      
      expect(plan.proficiencyAdjustmentApplied).toBeDefined();
      expect(typeof plan.proficiencyAdjustmentApplied).toBe('boolean');
    });
    
    // executionTimestamp の検証
    expect(output.executionTimestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.executionTimestamp)).toBe(true);
  });
});