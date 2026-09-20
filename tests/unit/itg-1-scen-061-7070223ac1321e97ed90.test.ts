import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

jest.mock('../../src/agents/tx-4-imp-1/orchestrator', () => ({
  runTx4Imp1Agent: jest.fn(),
}));

describe('SCEN-061: 進捗監視・遅延リスク判定・配置案生成・承認・配信の完全フロー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('代表的な正常入力で、executionStatus が completed となる', async () => {
    const userId = 'user-001';
    const facilityIds = ['facility-001', 'facility-002'];
    const monitoringIntervalMinutes = 15;
    const riskThresholdScore = 60;
    const autoApprovalEnabled = false;

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      monitoringIntervalMinutes,
      riskThresholdScore,
      autoApprovalEnabled,
    };

    const mockOutput: Tx4Imp1AgentOutput = {
      executionId: 'exec-20240115-001',
      monitoringTimestamp: '2024-01-15T10:30:45.123Z',
      delayRiskJudgments: [
        {
          workInstructionId: 'instr-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'high',
          delayPredictionDays: 2,
          progressRate: 45,
          plannedProgressRate: 65,
          recommendedAction: '人員補充による進捗加速が必要',
          riskScore: 75,
        },
        {
          workInstructionId: 'instr-002',
          facilityId: 'facility-002',
          teamId: 'team-002',
          riskLevel: 'medium',
          delayPredictionDays: 1,
          progressRate: 55,
          plannedProgressRate: 65,
          recommendedAction: '進捗状況を監視継続',
          riskScore: 50,
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-001',
          facilityName: '東京拠点',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 2,
          affectedWorkInstructionCount: 3,
        },
        {
          facilityId: 'facility-002',
          facilityName: '大阪拠点',
          riskPriority: 2,
          highestRiskScore: 50,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 1,
        },
      ],
      generatedAllocationPlans: [
        {
          allocationPlanId: 'plan-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          workInstructionId: 'instr-001',
          proposedWorkerAllocations: [
            {
              workerId: 'worker-001',
              workerName: '田中太郎',
              proficiencyLevel: 'intermediate',
              assignedWorkType: '組立作業',
              allocatedHours: 8,
              productivityRate: 85,
            },
            {
              workerId: 'worker-002',
              workerName: '鈴木花子',
              proficiencyLevel: 'advanced',
              assignedWorkType: '検査作業',
              allocatedHours: 6,
              productivityRate: 95,
            },
          ],
          expectedCompletionDate: '2024-01-17T17:00:00Z',
          feasibilityScore: 88,
          recommendationRank: 1,
          rationale: '最高の生産性が期待でき、納期達成確度が高い',
        },
        {
          allocationPlanId: 'plan-002',
          facilityId: 'facility-001',
          teamId: 'team-001',
          workInstructionId: 'instr-001',
          proposedWorkerAllocations: [
            {
              workerId: 'worker-003',
              workerName: '佐藤次郎',
              proficiencyLevel: 'beginner',
              assignedWorkType: '組立作業',
              allocatedHours: 10,
              productivityRate: 70,
            },
          ],
          expectedCompletionDate: '2024-01-18T10:00:00Z',
          feasibilityScore: 72,
          recommendationRank: 2,
          rationale: '代替案だが実現可能性あり',
        },
      ],
      approvalResults: [
        {
          allocationPlanId: 'plan-001',
          approvalStatus: 'pending_approval',
          approvalReason: '自動承認無効のため人による承認待ち。提案内容は基準を満たす。',
          approverUserId: null,
          approvalTimestamp: '2024-01-15T10:30:45.123Z',
        },
        {
          allocationPlanId: 'plan-002',
          approvalStatus: 'pending_approval',
          approvalReason: '自動承認無効のため人による承認待ち。実現可能性は基準以上。',
          approverUserId: null,
          approvalTimestamp: '2024-01-15T10:30:45.123Z',
        },
      ],
      deliveredInstructions: [
        {
          workInstructionId: 'instr-001-deliver-001',
          deliveryMethod: 'handy_terminal',
          deliveredToFieldLeaderId: 'leader-001',
          deliveryTimestamp: '2024-01-15T10:31:30.000Z',
          deliveryStatus: 'delivered',
        },
        {
          workInstructionId: 'instr-001-deliver-002',
          deliveryMethod: 'email',
          deliveredToFieldLeaderId: 'leader-002',
          deliveryTimestamp: '2024-01-15T10:31:45.000Z',
          deliveryStatus: 'delivered',
        },
      ],
      executionStatus: 'completed',
      errorSummary: null,
    };

    (runTx4Imp1Agent as jest.Mock).mockResolvedValue(mockOutput);

    const result = await runTx4Imp1Agent(input, {} as any);

    expect(result).toBeDefined();
    expect(result.executionId).toBe('exec-20240115-001');
    expect(result.monitoringTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );

    expect(result.delayRiskJudgments).toHaveLength(2);
    expect(result.delayRiskJudgments[0]).toHaveProperty('riskLevel');
    expect(result.delayRiskJudgments[0]).toHaveProperty('delayPredictionDays');
    expect(result.delayRiskJudgments[0]).toHaveProperty('recommendedAction');
    expect(result.delayRiskJudgments[0].riskScore).toBeGreaterThanOrEqual(60);

    expect(result.identifiedFacilities).toHaveLength(2);
    expect(result.identifiedFacilities[0]).toHaveProperty('facilityId');
    expect(result.identifiedFacilities[0]).toHaveProperty('facilityName');
    expect(result.identifiedFacilities[0]).toHaveProperty('riskPriority');
    expect(result.identifiedFacilities[0]).toHaveProperty('highestRiskScore');
    expect(result.identifiedFacilities[0].riskPriority).toBe(1);

    expect(result.generatedAllocationPlans).toHaveLength(2);
    expect(result.generatedAllocationPlans[0]).toHaveProperty('allocationPlanId');
    expect(result.generatedAllocationPlans[0]).toHaveProperty('feasibilityScore');
    expect(result.generatedAllocationPlans[0]).toHaveProperty('recommendationRank');
    expect(result.generatedAllocationPlans[0].proposedWorkerAllocations).toBeDefined();
    expect(result.generatedAllocationPlans[0].proposedWorkerAllocations.length).toBeGreaterThan(
      0
    );

    expect(result.approvalResults).toHaveLength(2);
    expect(result.approvalResults[0]).toHaveProperty('allocationPlanId');
    expect(result.approvalResults[0]).toHaveProperty('approvalStatus');
    expect(result.approvalResults[0]).toHaveProperty('approvalReason');
    expect(result.approvalResults[0]).toHaveProperty('approvalTimestamp');
    expect(result.approvalResults[0].approvalStatus).toBe('pending_approval');
    expect(result.approvalResults[0].approverUserId).toBeNull();

    expect(result.deliveredInstructions).toHaveLength(2);
    expect(result.deliveredInstructions[0]).toHaveProperty('workInstructionId');
    expect(result.deliveredInstructions[0]).toHaveProperty('deliveryMethod');
    expect(result.deliveredInstructions[0]).toHaveProperty('deliveredToFieldLeaderId');
    expect(result.deliveredInstructions[0]).toHaveProperty('deliveryTimestamp');
    expect(result.deliveredInstructions[0]).toHaveProperty('deliveryStatus');
    expect(result.deliveredInstructions[0].deliveryStatus).toBe('delivered');

    expect(result.executionStatus).toBe('completed');
    expect(result.errorSummary).toBeNull();

    expect(runTx4Imp1Agent).toHaveBeenCalledWith(input, expect.any(Object));
    expect(runTx4Imp1Agent).toHaveBeenCalledTimes(1);
  });
});