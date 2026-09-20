import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as progressMonitoringEngine from '../../src/logic/progress-monitoring-risk-engine';
import * as personnelAllocator from '../../src/logic/personnel-allocation-optimizer';
import * as allocationReviewer from '../../src/logic/allocation-plan-review-approval';
import * as deliveryManager from '../../src/logic/work-instruction-delivery-manager';
import * as auditLogger from '../../src/utils/audit-logger';
import * as authorizationService from '../../src/utils/authorization-service';

jest.mock('../../src/logic/progress-monitoring-risk-engine');
jest.mock('../../src/logic/personnel-allocation-optimizer');
jest.mock('../../src/logic/allocation-plan-review-approval');
jest.mock('../../src/logic/work-instruction-delivery-manager');
jest.mock('../../src/utils/audit-logger');
jest.mock('../../src/utils/authorization-service');

describe('SCEN-010: targetTeamIds未指定時、対象拠点の全チーム監視', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('targetTeamIdsが未指定の場合、対象拠点の全チームを監視対象とする', async () => {
    const executorUserId = 'user-001';
    const targetFacilityIds = ['facility-A'];
    const monitoringWindowMinutes = 60;
    const delayRiskThreshold = 60;
    const qualityVarianceThreshold = 15;
    const autoApprovalEnabled = true;

    // 権限認可スタブ
    (authorizationService.authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      userId: executorUserId,
      targetFacilities: targetFacilityIds,
    });

    // 監査ログスタブ
    (auditLogger.recordOperationAudit as jest.Mock).mockResolvedValue({
      auditId: 'audit-001',
      timestamp: new Date().toISOString(),
    });

    // 進捗遅延リスク判定スタブ
    // targetTeamIds未指定時、拠点配下の全チーム（team-X, team-Y, team-Z）を返す
    const delayDetectionResult = {
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
              teamId: 'team-X',
              teamName: 'チームX',
              progressRate: 45,
              plannedProgressRate: 60,
              delayDays: 2,
              qualityScore: 78,
            },
            {
              teamId: 'team-Y',
              teamName: 'チームY',
              progressRate: 50,
              plannedProgressRate: 60,
              delayDays: 1.5,
              qualityScore: 82,
            },
            {
              teamId: 'team-Z',
              teamName: 'チームZ',
              progressRate: 55,
              plannedProgressRate: 60,
              delayDays: 1,
              qualityScore: 85,
            },
          ],
        },
      ],
      qualityVarianceDetected: true,
      overallRiskScore: 75,
    };

    (progressMonitoringEngine.monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue(
      delayDetectionResult
    );

    // 人員配置案生成スタブ
    const generatedAllocationPlans = [
      {
        planId: 'plan-001',
        facilityId: 'facility-A',
        teamId: 'team-X',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: '作業者001',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 95,
          },
        ],
        feasibilityScore: 92,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-002',
        facilityId: 'facility-A',
        teamId: 'team-Y',
        workInstructionId: 'work-002',
        proposedAllocations: [
          {
            workerId: 'worker-002',
            workerName: '作業者002',
            assignedWorkType: 'packing',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 6,
            productivityRate: 98,
          },
        ],
        feasibilityScore: 88,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-003',
        facilityId: 'facility-A',
        teamId: 'team-Z',
        workInstructionId: 'work-003',
        proposedAllocations: [
          {
            workerId: 'worker-003',
            workerName: '作業者003',
            assignedWorkType: 'inspection',
            proficiencyLevel: 'expert',
            adjustedDifficulty: 'hard',
            estimatedWorkHours: 5,
            productivityRate: 100,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
    ];

    (personnelAllocator.generateAllocationPlans as jest.Mock).mockResolvedValue(
      generatedAllocationPlans
    );

    // 承認判定スタブ
    const approvedAllocationPlans = [
      {
        planId: 'plan-001',
        approvalStatus: 'auto_approved' as const,
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
      {
        planId: 'plan-002',
        approvalStatus: 'auto_approved' as const,
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
      {
        planId: 'plan-003',
        approvalStatus: 'auto_approved' as const,
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
    ];

    (allocationReviewer.judgeAllocationPlanApprovalWithCriteria as jest.Mock).mockResolvedValue(
      approvedAllocationPlans
    );

    // 配置指示配信スタブ
    const deliveryResults = [
      {
        deliveryId: 'delivery-001',
        planId: 'plan-001',
        targetFieldLeaderId: 'leader-001',
        deliveryStatus: 'delivered' as const,
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
      {
        deliveryId: 'delivery-002',
        planId: 'plan-002',
        targetFieldLeaderId: 'leader-002',
        deliveryStatus: 'delivered' as const,
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
      {
        deliveryId: 'delivery-003',
        planId: 'plan-003',
        targetFieldLeaderId: 'leader-003',
        deliveryStatus: 'delivered' as const,
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
    ];

    (deliveryManager.deliverAllocationPlanAndWorkInstructions as jest.Mock).mockResolvedValue(
      deliveryResults
    );

    // 処理実行
    const result = await runTx1Imp1Agent(
      {
        executorUserId,
        targetFacilityIds,
        targetTeamIds: undefined,
        monitoringWindowMinutes,
        delayRiskThreshold,
        qualityVarianceThreshold,
        autoApprovalEnabled,
      },
      {
        authorizeOperation: authorizationService.authorizeOperation,
        recordOperationAudit: auditLogger.recordOperationAudit,
        monitorAndJudgeDelayRisk: progressMonitoringEngine.monitorAndJudgeDelayRisk,
        generateAllocationPlans: personnelAllocator.generateAllocationPlans,
        judgeAllocationPlanApprovalWithCriteria:
          allocationReviewer.judgeAllocationPlanApprovalWithCriteria,
        deliverAllocationPlanAndWorkInstructions:
          deliveryManager.deliverAllocationPlanAndWorkInstructions,
      }
    );

    // 検証
    expect(result.executionStatus).toBe('completed');

    // 監視対象チームIDが拠点配下の全チームを網羅していることを確認
    const affectedTeamIds = result.delayDetectionResult.affectedFacilities[0].affectedTeams.map(
      (team) => team.teamId
    );
    expect(affectedTeamIds).toContain('team-X');
    expect(affectedTeamIds).toContain('team-Y');
    expect(affectedTeamIds).toContain('team-Z');
    expect(affectedTeamIds.length).toBe(3);

    // 生成された配置案が全チームに対して存在すること
    expect(result.generatedAllocationPlans).toHaveLength(3);
    const generatedTeamIds = result.generatedAllocationPlans.map((plan) => plan.teamId);
    expect(generatedTeamIds).toContain('team-X');
    expect(generatedTeamIds).toContain('team-Y');
    expect(generatedTeamIds).toContain('team-Z');

    // 承認済み配置案が全チームに対して存在すること
    expect(result.approvedAllocationPlans).toHaveLength(3);
    const approvedPlanIds = result.approvedAllocationPlans.map((plan) => plan.planId);
    expect(approvedPlanIds).toContain('plan-001');
    expect(approvedPlanIds).toContain('plan-002');
    expect(approvedPlanIds).toContain('plan-003');

    // 配置指示配信結果が全監視対象チームに含まれていること
    expect(result.deliveryResults).toHaveLength(3);
    const deliveredPlanIds = result.deliveryResults.map((delivery) => delivery.planId);
    expect(deliveredPlanIds).toContain('plan-001');
    expect(deliveredPlanIds).toContain('plan-002');
    expect(deliveredPlanIds).toContain('plan-003');

    // エラーが存在しないこと
    expect(result.executionErrors).toBeUndefined();
  });
});