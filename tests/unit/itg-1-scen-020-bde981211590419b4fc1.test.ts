import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  DelayDetectionResult,
  AffectedFacility,
  AffectedTeam,
  GeneratedAllocationPlan,
  ProposedAllocation,
  ApprovedAllocationPlan,
  DeliveryResult,
} from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-020: 進捗遅延・品質ばらつき検知から配置指示配信まで', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  const executorUserId = 'user-001';
  const targetFacilityIds = ['facility-A', 'facility-B'];
  const monitoringWindowMinutes = 60;
  const delayRiskThreshold = 60;
  const qualityVarianceThreshold = 15;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      detectionTimestamp: '2024-01-15T14:30:00Z',
      delayDetected: true,
      affectedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: '東京拠点',
          riskScore: 75,
          riskRank: 1,
          delayReasons: ['insufficient_personnel', 'low_productivity'],
          affectedTeams: [
            {
              teamId: 'team-A1',
              teamName: 'チームA1',
              progressRate: 45,
              plannedProgressRate: 60,
              delayDays: 1.5,
              qualityScore: 72,
            },
          ],
        },
        {
          facilityId: 'facility-B',
          facilityName: '大阪拠点',
          riskScore: 68,
          riskRank: 2,
          delayReasons: ['priority_misalignment'],
          affectedTeams: [
            {
              teamId: 'team-B2',
              teamName: 'チームB2',
              progressRate: 50,
              plannedProgressRate: 65,
              delayDays: 1.2,
              qualityScore: 65,
            },
          ],
        },
      ],
      qualityVarianceDetected: true,
      overallRiskScore: 70,
    });

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        planId: 'plan-001',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        workInstructionId: 'work-inst-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: '田中太郎',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 95,
          },
          {
            workerId: 'worker-002',
            workerName: '鈴木花子',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 110,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 1,
        estimatedCompletionDate: '2024-01-16T18:00:00Z',
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-002',
        facilityId: 'facility-B',
        teamId: 'team-B2',
        workInstructionId: 'work-inst-002',
        proposedAllocations: [
          {
            workerId: 'worker-003',
            workerName: '佐藤次郎',
            assignedWorkType: 'inspection',
            proficiencyLevel: 'beginner',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 6,
            productivityRate: 80,
          },
        ],
        feasibilityScore: 72,
        recommendationRank: 2,
        estimatedCompletionDate: '2024-01-17T10:00:00Z',
        proficiencyAdjustmentApplied: false,
      },
    ]);

    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue([
      {
        planId: 'plan-001',
        approvalStatus: 'auto_approved',
        approvalTimestamp: '2024-01-15T14:32:00Z',
        approverUserId: null,
      },
    ]);

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue([
      {
        deliveryId: 'delivery-001',
        planId: 'plan-001',
        targetFieldLeaderId: 'leader-001',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:32:45Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:10Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:00Z',
      },
      {
        deliveryId: 'delivery-002',
        planId: 'plan-001',
        targetFieldLeaderId: 'leader-002',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:32:50Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:15Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:05Z',
      },
      {
        deliveryId: 'delivery-003',
        planId: 'plan-001',
        targetFieldLeaderId: 'leader-003',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:32:55Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:20Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:10Z',
      },
      {
        deliveryId: 'delivery-004',
        planId: 'plan-001',
        targetFieldLeaderId: 'leader-004',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:00Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:25Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:15Z',
      },
      {
        deliveryId: 'delivery-005',
        planId: 'plan-001',
        targetFieldLeaderId: 'leader-005',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:05Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:30Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:20Z',
      },
      {
        deliveryId: 'delivery-006',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-001',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:10Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:35Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:25Z',
      },
      {
        deliveryId: 'delivery-007',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-002',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:15Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:40Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:30Z',
      },
      {
        deliveryId: 'delivery-008',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-003',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:20Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:45Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:35Z',
      },
      {
        deliveryId: 'delivery-009',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-004',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:25Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:50Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:40Z',
      },
      {
        deliveryId: 'delivery-010',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-005',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:30Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:33:55Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:45Z',
      },
      {
        deliveryId: 'delivery-011',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-006',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:35Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:00Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:50Z',
      },
      {
        deliveryId: 'delivery-012',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-007',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:40Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:05Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:34:55Z',
      },
      {
        deliveryId: 'delivery-013',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-008',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:45Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:10Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:35:00Z',
      },
      {
        deliveryId: 'delivery-014',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-009',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:50Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:15Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:35:05Z',
      },
      {
        deliveryId: 'delivery-015',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-010',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:33:55Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:20Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:35:10Z',
      },
      {
        deliveryId: 'delivery-016',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-011',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:34:00Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:25Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:35:15Z',
      },
      {
        deliveryId: 'delivery-017',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-012',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:34:05Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:30Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:35:20Z',
      },
      {
        deliveryId: 'delivery-018',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-013',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:34:10Z',
        receptionConfirmed: true,
        receptionConfirmationTimestamp: '2024-01-15T14:34:35Z',
        executionStarted: true,
        executionStartTimestamp: '2024-01-15T14:35:25Z',
      },
      {
        deliveryId: 'delivery-019',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-014',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-15T14:34:15Z',
        receptionConfirmed: false,
        receptionConfirmationTimestamp: null,
        executionStarted: false,
        executionStartTimestamp: null,
      },
      {
        deliveryId: 'delivery-020',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-015',
        deliveryStatus: 'pending_reception',
        deliveryTimestamp: '2024-01-15T14:34:20Z',
        receptionConfirmed: false,
        receptionConfirmationTimestamp: null,
        executionStarted: false,
        executionStartTimestamp: null,
      },
      {
        deliveryId: 'delivery-021',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-016',
        deliveryStatus: 'pending_reception',
        deliveryTimestamp: '2024-01-15T14:34:25Z',
        receptionConfirmed: false,
        receptionConfirmationTimestamp: null,
        executionStarted: false,
        executionStartTimestamp: null,
      },
      {
        deliveryId: 'delivery-022',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-017',
        deliveryStatus: 'delivery_failed',
        deliveryTimestamp: '2024-01-15T14:34:30Z',
        receptionConfirmed: false,
        receptionConfirmationTimestamp: null,
        executionStarted: false,
        executionStartTimestamp: null,
      },
      {
        deliveryId: 'delivery-023',
        planId: 'plan-001',
        targetFieldLeaderId: 'worker-018',
        deliveryStatus: 'delivery_failed',
        deliveryTimestamp: '2024-01-15T14:34:35Z',
        receptionConfirmed: false,
        receptionConfirmationTimestamp: null,
        executionStarted: false,
        executionStartTimestamp: null,
      },
    ]);

    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);
  });

  test('正常系：deliveryResultsには各現場リーダー・作業者への配信成功/失敗・配信日時・受領確認状況が格納される', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds,
      targetTeamIds: undefined,
      monitoringWindowMinutes,
      delayRiskThreshold,
      qualityVarianceThreshold,
      autoApprovalEnabled: true,
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    // 1. executionId が UUID形式であることを検証
    expect(output.executionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // 2. executionStatus が 'completed' であることを検証
    expect(output.executionStatus).toBe('completed');

    // 3. delayDetectionResult の検証
    expect(output.delayDetectionResult).toBeDefined();
    expect(output.delayDetectionResult.delayDetected).toBe(true);
    expect(output.delayDetectionResult.affectedFacilities).toHaveLength(2);

    // 拠点A: リスクスコア75
    const facilityA = output.delayDetectionResult.affectedFacilities.find(
      (f) => f.facilityId === 'facility-A'
    );
    expect(facilityA).toBeDefined();
    expect(facilityA!.riskScore).toBe(75);
    expect(facilityA!.riskRank).toBe(1);
    expect(facilityA!.affectedTeams).toHaveLength(1);

    // 拠点B: リスクスコア68
    const facilityB = output.delayDetectionResult.affectedFacilities.find(
      (f) => f.facilityId === 'facility-B'
    );
    expect(facilityB).toBeDefined();
    expect(facilityB!.riskScore).toBe(68);
    expect(facilityB!.riskRank).toBe(2);

    // 品質ばらつき検知
    expect(output.delayDetectionResult.qualityVarianceDetected).toBe(true);

    // 4. generatedAllocationPlans の検証
    expect(output.generatedAllocationPlans).toHaveLength(2);

    const plan1 = output.generatedAllocationPlans.find((p) => p.planId === 'plan-001');
    expect(plan1).toBeDefined();
    expect(plan1!.feasibilityScore).toBe(85);
    expect(plan1!.recommendationRank).toBe(1);
    expect(plan1!.proficiencyAdjustmentApplied).toBe(true);

    const plan2 = output.generatedAllocationPlans.find((p) => p.planId === 'plan-002');
    expect(plan2).toBeDefined();
    expect(plan2!.feasibilityScore).toBe(72);
    expect(plan2!.recommendationRank).toBe(2);
    expect(plan2!.proficiencyAdjustmentApplied).toBe(false);

    // 5. approvedAllocationPlans の検証
    expect(output.approvedAllocationPlans).toHaveLength(1);
    const approvedPlan = output.approvedAllocationPlans[0];
    expect(approvedPlan.planId).toBe('plan-001');
    expect(approvedPlan.approvalStatus).toBe('auto_approved');
    expect(approvedPlan.approvalTimestamp).toBe('2024-01-15T14:32:00Z');
    expect(approvedPlan.approverUserId).toBeNull();

    // 6. deliveryResults の検証
    expect(output.deliveryResults).toHaveLength(23);

    // 6.1 現場リーダーと作業者の区別確認：現場リーダー5名、作業者18名
    const leaderDeliveries = output.deliveryResults.filter((d) =>
      d.targetFieldLeaderId.startsWith('leader-')
    );
    const workerDeliveries = output.deliveryResults.filter((d) =>
      d.targetFieldLeaderId.startsWith('worker-')
    );
    expect(leaderDeliveries).toHaveLength(5);
    expect(workerDeliveries).toHaveLength(18);

    // 6.2 成功件数：18件（全現場リーダー5名+作業者13名）を検証
    const successResults = output.deliveryResults.filter(
      (d) => d.deliveryStatus === 'delivered' && d.receptionConfirmed === true
    );
    expect(successResults).toHaveLength(18);
    const successLeaders = successResults.filter((d) => d.targetFieldLeaderId.startsWith('leader-'));
    const successWorkers = successResults.filter((d) => d.targetFieldLeaderId.startsWith('worker-'));
    expect(successLeaders).toHaveLength(5);
    expect(successWorkers).toHaveLength(13);

    // 6.3 配信失敗件数: 2件を検証
    const failedResults = output.deliveryResults.filter(
      (d) => d.deliveryStatus === 'delivery_failed'
    );
    expect(failedResults).toHaveLength(2);
    failedResults.forEach((d) => {
      expect(d.targetFieldLeaderId.startsWith('worker-')).toBe(true);
    });

    // 6.4 未配信件数: pending_reception + delivered未確認 で3件を検証
    const pendingResults = output.deliveryResults.filter(
      (d) => d.deliveryStatus === 'pending_reception'
    );
    expect(pendingResults).toHaveLength(2);
    const unconfirmedDelivered = output.deliveryResults.filter(
      (d) => d.deliveryStatus === 'delivered' && d.receptionConfirmed === false
    );
    expect(unconfirmedDelivered).toHaveLength(1);
    expect(pendingResults.length + unconfirmedDelivered.length).toBe(3);

    // 6.5 受領確認済み件数: 15件を検証
    const confirmedResults = output.deliveryResults.filter(
      (d) => d.receptionConfirmed === true
    );
    expect(confirmedResults).toHaveLength(15);
    confirmedResults.forEach((d) => {
      expect(d.receptionConfirmationTimestamp).toBeDefined();
      expect(typeof d.receptionConfirmationTimestamp).toBe('string');
    });

    // 6.6 配信状況の検証：各オブジェクトにユーザーID、配信ステータス、配信タイムスタンプを含むこと
    output.deliveryResults.forEach((d) => {
      expect(d.targetFieldLeaderId).toBeDefined();
      expect(['delivered', 'delivery_failed', 'pending_reception']).toContain(d.deliveryStatus);
      expect(d.deliveryTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    // 7. 業務値検証
    // 配信タイムスタンプが実行完了タイムスタンプ以前
    output.deliveryResults.forEach((d) => {
      const deliveryTime = new Date(d.deliveryTimestamp).getTime();
      const executionTime = new Date(output.executionTimestamp).getTime();
      expect(deliveryTime).toBeLessThanOrEqual(executionTime);
    });

    // 受領確認タイムスタンプが配信タイムスタンプ以降
    confirmedResults.forEach((d) => {
      const deliveryTime = new Date(d.deliveryTimestamp).getTime();
      const confirmTime = new Date(d.receptionConfirmationTimestamp!).getTime();
      expect(confirmTime).toBeGreaterThanOrEqual(deliveryTime);
    });

    // 件数関係の検証：成功18件 + 未配信3件 + 失敗2件 = 総配信数23件
    const successCount = output.deliveryResults.filter(
      (d) => d.deliveryStatus === 'delivered' && d.receptionConfirmed === true
    ).length;
    const unconfirmedCount = output.deliveryResults.filter(
      (d) => d.deliveryStatus === 'pending_reception' || (d.deliveryStatus === 'delivered' && d.receptionConfirmed === false)
    ).length;
    const failureCount = output.deliveryResults.filter(
      (d) => d.deliveryStatus === 'delivery_failed'
    ).length;
    expect(successCount).toBe(18);
    expect(unconfirmedCount).toBe(3);
    expect(failureCount).toBe(2);
    expect(successCount + unconfirmedCount + failureCount).toBe(output.deliveryResults.length);

    // 8. モック呼び出しの検証：各ステップの依存関数が呼ばれたことを確認
    expect(mockAuthorizeOperation).toHaveBeenCalled();
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    // 9. executionErrors は空配列
    expect(output.executionErrors).toEqual([]);

    // 10. executionTimestamp は ISO 8601形式
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});