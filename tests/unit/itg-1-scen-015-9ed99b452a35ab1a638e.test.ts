import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  DelayDetectionResult,
  GeneratedAllocationPlan,
  ApprovedAllocationPlan,
} from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-015: autoApprovalEnabledがfalseの場合、全ての配置案が承認者に提示される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      authorizeOperation: jest.fn(),
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
    };
  });

  it('autoApprovalEnabledがfalseの場合、基準内・基準外の全配置案が承認者に提示される', async () => {
    // ステップ1: 入力パラメータを構成
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A'],
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: false,
    };

    // ステップ2: authorizeOperationをスタブ化
    mockAiClient.authorizeOperation.mockResolvedValue({
      authorized: true,
      executorUserId: 'user-001',
      facilities: ['facility-A'],
    });

    // ステップ3: monitorAndJudgeDelayRiskをスタブ化
    mockAiClient.monitorAndJudgeDelayRisk.mockResolvedValue({
      delayDetectionResult: {
        detectionTimestamp: new Date().toISOString(),
        delayDetected: true,
        affectedFacilities: [
          {
            facilityId: 'facility-A',
            facilityName: '拠点A',
            riskScore: 75,
            riskRank: 1,
            delayReasons: ['insufficient_personnel', 'low_productivity'],
            affectedTeams: [
              {
                teamId: 'team-001',
                teamName: 'チームA',
                progressRate: 45,
                plannedProgressRate: 70,
                delayDays: 2,
                qualityScore: 65,
              },
            ],
          },
        ],
        qualityVarianceDetected: true,
        overallRiskScore: 75,
      },
    });

    // ステップ4: generateAllocationPlansをスタブ化
    const generatedPlans: GeneratedAllocationPlan[] = [
      {
        planId: 'plan-001',
        facilityId: 'facility-A',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Worker A',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 95,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-002',
        facilityId: 'facility-A',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-002',
            workerName: 'Worker B',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'beginner',
            adjustedDifficulty: 'hard',
            estimatedWorkHours: 12,
            productivityRate: 60,
          },
        ],
        feasibilityScore: 40,
        recommendationRank: 2,
        estimatedCompletionDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: false,
      },
    ];

    mockAiClient.generateAllocationPlans.mockResolvedValue({
      generatedAllocationPlans: generatedPlans,
    });

    // ステップ5: judgeAllocationPlanApprovalWithCriteriaをスタブ化
    const approvedPlans: ApprovedAllocationPlan[] = [
      {
        planId: 'plan-001',
        approvalStatus: 'manual_approved',
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
      {
        planId: 'plan-002',
        approvalStatus: 'manual_approved',
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
    ];

    mockAiClient.judgeAllocationPlanApprovalWithCriteria.mockResolvedValue({
      approvedAllocationPlans: approvedPlans,
    });

    // ステップ6: runTx1Imp1Agentを呼び出し
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // ステップ7: generatedAllocationPlansが2件すべて含まれることを確認
    expect(result.generatedAllocationPlans).toHaveLength(2);
    expect(result.generatedAllocationPlans[0].planId).toBe('plan-001');
    expect(result.generatedAllocationPlans[1].planId).toBe('plan-002');

    // ステップ8: approvedAllocationPlansを検査
    expect(result.approvedAllocationPlans).toHaveLength(2);
    const approvedPlanIds = result.approvedAllocationPlans.map((p) => p.planId);
    expect(approvedPlanIds).toContain('plan-001');
    expect(approvedPlanIds).toContain('plan-002');

    // 両案とも承認者提示待ち状態（autoApprovalEnabledがfalseなため）
    result.approvedAllocationPlans.forEach((plan) => {
      expect(['manual_approved', 'pending']).toContain(plan.approvalStatus);
    });

    // ステップ9: deliveryResultsが空配列またはnullであることを確認
    expect(
      result.deliveryResults === null || result.deliveryResults.length === 0
    ).toBeTruthy();

    // ステップ10: executionStatusが'completed'であることを確認
    expect(result.executionStatus).toBe('completed');

    // ステップ11: delayDetectionResultが遅延検知ありの状態を確認
    expect(result.delayDetectionResult.delayDetected).toBe(true);
    expect(result.delayDetectionResult.overallRiskScore).toBe(75);
    expect(result.delayDetectionResult.affectedFacilities).toHaveLength(1);
    expect(result.delayDetectionResult.affectedFacilities[0].facilityId).toBe(
      'facility-A'
    );
    expect(result.delayDetectionResult.affectedFacilities[0].riskScore).toBe(75);
    expect(result.delayDetectionResult.qualityVarianceDetected).toBe(true);

    // executionErrorsは発生なし
    expect(
      result.executionErrors === undefined || result.executionErrors.length === 0
    ).toBeTruthy();
  });
});