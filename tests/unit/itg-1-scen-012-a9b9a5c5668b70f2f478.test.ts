import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  DelayDetectionResult,
  AffectedFacility,
  AffectedTeam,
  GeneratedAllocationPlan,
  ApprovedAllocationPlan,
  DeliveryResult,
} from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-012: 境界系：delayRiskThresholdをデフォルト値60で実行した場合、そのリスクスコア以上の拠点・チームに対応が必要と判定される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
      authorizeOperation: jest.fn(),
    };
  });

  it('delayRiskThreshold=60で実行した場合、そのリスクスコア以上の拠点・チームのみが対応対象となる', async () => {
    // テスト前提条件の準備
    const executorUserId = 'admin-user-001';
    const targetFacilityIds = ['facility-a', 'facility-b'];

    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds,
      targetTeamIds: [],
      monitoringWindowMinutes: undefined,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: undefined,
      autoApprovalEnabled: undefined,
    };

    // authorizeOperationのスタブ準備：権限ありを返却
    mockAiClient.authorizeOperation.mockResolvedValueOnce({
      authorized: true,
      userId: executorUserId,
    });

    // monitorAndJudgeDelayRiskのスタブ準備
    // 拠点A・チーム1：リスクスコア60（閾値と同値 → 対応対象）
    // 拠点A・チーム2：リスクスコア45（閾値未満 → 対応対象外）
    // 拠点B・チーム1：リスクスコア75（閾値超過 → 対応対象）
    const delayDetectionResult: DelayDetectionResult = {
      detectionTimestamp: new Date().toISOString(),
      delayDetected: true,
      affectedFacilities: [
        {
          facilityId: 'facility-a',
          facilityName: '拠点A',
          riskScore: 60,
          riskRank: 2,
          delayReasons: ['insufficient_personnel', 'low_productivity'],
          affectedTeams: [
            {
              teamId: 'team-a-1',
              teamName: 'チームA-1',
              progressRate: 45,
              plannedProgressRate: 70,
              delayDays: 2,
              qualityScore: 75,
            },
            {
              teamId: 'team-a-2',
              teamName: 'チームA-2',
              progressRate: 65,
              plannedProgressRate: 70,
              delayDays: 1,
              qualityScore: 80,
            },
          ],
        },
        {
          facilityId: 'facility-b',
          facilityName: '拠点B',
          riskScore: 75,
          riskRank: 1,
          delayReasons: ['priority_misalignment', 'quality_issue'],
          affectedTeams: [
            {
              teamId: 'team-b-1',
              teamName: 'チームB-1',
              progressRate: 30,
              plannedProgressRate: 65,
              delayDays: 3,
              qualityScore: 65,
            },
          ],
        },
      ],
      qualityVarianceDetected: true,
      overallRiskScore: 70,
    };

    mockAiClient.monitorAndJudgeDelayRisk.mockResolvedValueOnce(
      delayDetectionResult
    );

    // generateAllocationPlansのスタブ準備
    // 対応対象チーム（スコア60以上）のみの配置案を生成
    const generatedPlans: GeneratedAllocationPlan[] = [
      {
        planId: 'plan-a-1',
        facilityId: 'facility-a',
        teamId: 'team-a-1',
        workInstructionId: 'work-instr-a-1',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Worker A',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 95,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-b-1',
        facilityId: 'facility-b',
        teamId: 'team-b-1',
        workInstructionId: 'work-instr-b-1',
        proposedAllocations: [
          {
            workerId: 'worker-002',
            workerName: 'Worker B',
            assignedWorkType: 'inspection',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 6,
            productivityRate: 105,
          },
        ],
        feasibilityScore: 90,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(
          Date.now() + 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
    ];

    mockAiClient.generateAllocationPlans.mockResolvedValueOnce(
      generatedPlans
    );

    // judgeAllocationPlanApprovalWithCriteriaのスタブ準備
    const approvedPlans: ApprovedAllocationPlan[] = [
      {
        planId: 'plan-a-1',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
      {
        planId: 'plan-b-1',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
    ];

    mockAiClient.judgeAllocationPlanApprovalWithCriteria.mockResolvedValueOnce(
      approvedPlans
    );

    // deliverAllocationPlanAndWorkInstructionsのスタブ準備
    const deliveryResults: DeliveryResult[] = [
      {
        deliveryId: 'delivery-001',
        planId: 'plan-a-1',
        targetFieldLeaderId: 'leader-a-1',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
      {
        deliveryId: 'delivery-002',
        planId: 'plan-b-1',
        targetFieldLeaderId: 'leader-b-1',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
    ];

    mockAiClient.deliverAllocationPlanAndWorkInstructions.mockResolvedValueOnce(
      deliveryResults
    );

    // runTx1Imp1Agentを実行
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // executionStatusを検証
    expect(result.executionStatus).toBe('completed');

    // delayDetectionResultのリスク判定対象チーム一覧を検証
    expect(result.delayDetectionResult.delayDetected).toBe(true);
    expect(result.delayDetectionResult.affectedFacilities).toHaveLength(2);

    // 拠点Aのリスクスコアを検証
    const facilityA = result.delayDetectionResult.affectedFacilities.find(
      (f) => f.facilityId === 'facility-a'
    );
    expect(facilityA).toBeDefined();
    expect(facilityA!.riskScore).toBe(60);

    // 拠点Bのリスクスコアを検証
    const facilityB = result.delayDetectionResult.affectedFacilities.find(
      (f) => f.facilityId === 'facility-b'
    );
    expect(facilityB).toBeDefined();
    expect(facilityB!.riskScore).toBe(75);

    // generatedAllocationPlansが存在することを検証
    expect(result.generatedAllocationPlans).toBeDefined();
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);

    // 生成された配置案は対応対象チーム（スコア60以上）のみを含む
    const generatedPlanTeamIds = result.generatedAllocationPlans.map(
      (p) => p.teamId
    );
    expect(generatedPlanTeamIds).toContain('team-a-1');
    expect(generatedPlanTeamIds).toContain('team-b-1');
    
    // 対応対象外のチーム（team-a-2）の配置案が生成されていないことを検証
    expect(generatedPlanTeamIds).not.toContain('team-a-2');

    // approvedAllocationPlansが存在することを検証
    expect(result.approvedAllocationPlans).toBeDefined();
    expect(result.approvedAllocationPlans.length).toBeGreaterThan(0);
    expect(result.approvedAllocationPlans.length).toBeLessThanOrEqual(
      result.generatedAllocationPlans.length
    );

    // 承認済み配置案についても対応対象外のチーム分が含まれていないことを検証
    const approvedPlanTeamIds = result.approvedAllocationPlans.map(
      (p) => result.generatedAllocationPlans.find((gp) => gp.planId === p.planId)?.teamId
    );
    expect(approvedPlanTeamIds).not.toContain('team-a-2');

    // deliveryResultsが存在することを検証
    expect(result.deliveryResults).toBeDefined();
    expect(result.deliveryResults.length).toBeGreaterThan(0);

    // 配信結果が承認済み配置案と対応することを検証
    const approvedPlanIds = result.approvedAllocationPlans.map((p) => p.planId);
    result.deliveryResults.forEach((delivery) => {
      expect(approvedPlanIds).toContain(delivery.planId);
    });

    // executionIdとexecutionTimestampがISO 8601形式で設定されていることを検証
    expect(result.executionId).toBeDefined();
    expect(result.executionId).toMatch(/^[a-f0-9-]{36}$|^[a-zA-Z0-9_-]+$/);
    expect(result.executionTimestamp).toBeDefined();
    expect(() => new Date(result.executionTimestamp)).not.toThrow();

    // 権限検証が呼び出されたことを検証
    expect(mockAiClient.authorizeOperation).toHaveBeenCalledWith(
      executorUserId
    );
  });
});