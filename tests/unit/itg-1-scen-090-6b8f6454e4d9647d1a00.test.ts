import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import * as authModule from '../../src/logic/auth-authorization-audit';
import * as persistenceModule from '../../src/logic/data-persistence';
import * as aggregationModule from '../../src/logic/work-result-productivity-aggregation';
import * as optimizerModule from '../../src/logic/personnel-allocation-optimizer';
import * as approvalModule from '../../src/logic/allocation-plan-review-approval';
import * as deliveryModule from '../../src/logic/work-instruction-delivery-manager';
import * as notificationModule from '../../src/logic/notification-external-integration';

describe('SCEN-090: 受注急増の検知から現場リーダーへの指示配信まで', () => {
  const mockUserId = 'user-001';
  const mockOrderSurgeEvent = {
    eventId: 'event-surge-001',
    facilityId: 'facility-A',
    detectionTimestamp: '2024-01-15T10:00:00Z',
    surgeQuantity: 500,
    surgePercentage: 150,
  };
  const mockTargetFacilityIds = ['facility-A', 'facility-B', 'facility-C'];
  const mockAnalysisTimeWindowMinutes = 60;
  const mockAutoApprovalThreshold = 80;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('受注急増検知から配置指示配信までが正常に完了する', async () => {
    // ステップ2: 権限検証のスタブ化
    jest.spyOn(authModule, 'authorizeOperation').mockResolvedValue({
      isAuthorized: true,
      userId: mockUserId,
      permissions: ['surge_detection', 'allocation_approval', 'instruction_delivery'],
    });

    // ステップ3: 進捗データ取得のスタブ化（targetFacilityIds に対応）
    const mockProgressData = [
      {
        facilityId: 'facility-A',
        teamId: 'team-A1',
        teamName: 'Team A1',
        currentProgressRate: 60,
        plannedProgressRate: 75,
        delayDays: 2,
        currentHeadcount: 10,
        recommendedHeadcount: 15,
      },
      {
        facilityId: 'facility-B',
        teamId: 'team-B1',
        teamName: 'Team B1',
        currentProgressRate: 45,
        plannedProgressRate: 75,
        delayDays: 5,
        currentHeadcount: 8,
        recommendedHeadcount: 12,
      },
      {
        facilityId: 'facility-C',
        teamId: 'team-C1',
        teamName: 'Team C1',
        currentProgressRate: 70,
        plannedProgressRate: 75,
        delayDays: 1,
        currentHeadcount: 12,
        recommendedHeadcount: 13,
      },
    ];
    jest.spyOn(persistenceModule, 'listProgressDataByCondition').mockImplementation((conditions) => {
      // targetFacilityIds が条件として渡されることを想定
      if (conditions && Array.isArray(conditions.facilityIds)) {
        return Promise.resolve(
          mockProgressData.filter(data => conditions.facilityIds.includes(data.facilityId))
        );
      }
      return Promise.resolve(mockProgressData);
    });

    // ステップ4: 生産性データ取得のスタブ化（analysisTimeWindowMinutes に対応）
    const mockProductivityData = [
      {
        workerId: 'worker-001',
        workerName: 'Worker A',
        teamId: 'team-A1',
        proficiencyLevel: '上級',
        averageProductivityRate: 85,
        qualityScore: 92,
        strongWorkTypes: ['assembly', 'inspection'],
        capacityUtilization: 95,
      },
      {
        workerId: 'worker-002',
        workerName: 'Worker B',
        teamId: 'team-B1',
        proficiencyLevel: '中級',
        averageProductivityRate: 70,
        qualityScore: 85,
        strongWorkTypes: ['packing'],
        capacityUtilization: 80,
      },
      {
        workerId: 'worker-003',
        workerName: 'Worker C',
        teamId: 'team-C1',
        proficiencyLevel: '初級',
        averageProductivityRate: 65,
        qualityScore: 78,
        strongWorkTypes: ['basic_assembly'],
        capacityUtilization: 75,
      },
    ];
    jest.spyOn(persistenceModule, 'listProductivityDataByCondition').mockImplementation((conditions) => {
      // analysisTimeWindowMinutes が条件として渡されることを想定
      if (conditions && conditions.timeWindowMinutes) {
        return Promise.resolve(mockProductivityData);
      }
      return Promise.resolve(mockProductivityData);
    });

    // ステップ5: 作業者リスト取得のスタブ化（利用可能な作業者）
    const mockWorkers = [
      {
        workerId: 'worker-001',
        workerName: 'Worker A',
        proficiencyLevel: '上級',
        currentFacilityId: 'facility-A',
        currentTeamId: 'team-A1',
        operationStatus: '稼働中',
      },
      {
        workerId: 'worker-002',
        workerName: 'Worker B',
        proficiencyLevel: '中級',
        currentFacilityId: 'facility-B',
        currentTeamId: 'team-B1',
        operationStatus: '稼働中',
      },
      {
        workerId: 'worker-003',
        workerName: 'Worker C',
        proficiencyLevel: '初級',
        currentFacilityId: 'facility-C',
        currentTeamId: 'team-C1',
        operationStatus: '稼働中',
      },
    ];
    jest.spyOn(persistenceModule, 'getWorkerWithProficiencyAndProductivity').mockResolvedValue(mockWorkers);

    // ステップ6: 進捗・生産性分析のスタブ化（複数チーム間のボトルネック・効率低下箇所を含む）
    const mockAnalysisResult = {
      analysisTimestamp: '2024-01-15T10:05:00Z',
      targetFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          teams: [
            {
              teamId: 'team-A1',
              teamName: 'Team A1',
              currentProgressRate: 60,
              plannedProgressRate: 75,
              delayDays: 2,
              currentHeadcount: 10,
              recommendedHeadcount: 15,
            },
          ],
          overallProgressRate: 60,
          delayRiskLevel: 'high' as const,
        },
        {
          facilityId: 'facility-B',
          facilityName: 'Facility B',
          teams: [
            {
              teamId: 'team-B1',
              teamName: 'Team B1',
              currentProgressRate: 45,
              plannedProgressRate: 75,
              delayDays: 5,
              currentHeadcount: 8,
              recommendedHeadcount: 12,
            },
          ],
          overallProgressRate: 45,
          delayRiskLevel: 'critical' as const,
        },
        {
          facilityId: 'facility-C',
          facilityName: 'Facility C',
          teams: [
            {
              teamId: 'team-C1',
              teamName: 'Team C1',
              currentProgressRate: 70,
              plannedProgressRate: 75,
              delayDays: 1,
              currentHeadcount: 12,
              recommendedHeadcount: 13,
            },
          ],
          overallProgressRate: 70,
          delayRiskLevel: 'medium' as const,
        },
      ],
      productivityInsights: mockProductivityData,
      bottleneckAnalysis: {
        criticalBottlenecks: [
          {
            bottleneckId: 'bn-001',
            workInstructionId: 'wi-001',
            severity: 'critical' as const,
            rootCause: '人員不足',
            recommendedAction: 'facility-Cから2名配置',
          },
        ],
        staffingGapsByTeam: [
          {
            teamId: 'team-A1',
            currentHeadcount: 10,
            requiredHeadcount: 15,
            gap: 5,
            requiredProficiencyLevels: ['上級', '中級'],
          },
          {
            teamId: 'team-B1',
            currentHeadcount: 8,
            requiredHeadcount: 12,
            gap: 4,
            requiredProficiencyLevels: ['中級', '初級'],
          },
        ],
        priorityAdjustmentRecommendations: [
          {
            workInstructionId: 'wi-001',
            currentPriority: 2,
            recommendedPriority: 1,
            rationale: '納期が近い',
          },
        ],
      },
    };
    jest.spyOn(aggregationModule, 'aggregateWorkResultsAndCalculateProductivity').mockResolvedValue(mockAnalysisResult);

    // ステップ7: 配置案生成のスタブ化（実現可能性スコア・推奨順位付き）
    const mockAllocationPlans = [
      {
        planId: 'plan-001',
        planName: '配置案1',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        proposedAllocations: [
          { workerId: 'worker-002', sourceTeamId: 'team-B1', targetTeamId: 'team-A1' },
          { workerId: 'worker-003', sourceTeamId: 'team-C1', targetTeamId: 'team-A1' },
        ],
        feasibilityScore: 92,
        recommendationRank: 1,
        expectedCompletionDate: '2024-01-16T18:00:00Z',
      },
      {
        planId: 'plan-002',
        planName: '配置案2',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        proposedAllocations: [
          { workerId: 'worker-003', sourceTeamId: 'team-C1', targetTeamId: 'team-A1' },
        ],
        feasibilityScore: 85,
        recommendationRank: 2,
        expectedCompletionDate: '2024-01-17T12:00:00Z',
      },
      {
        planId: 'plan-003',
        planName: '配置案3',
        facilityId: 'facility-B',
        teamId: 'team-B1',
        proposedAllocations: [
          { workerId: 'worker-001', sourceTeamId: 'team-A1', targetTeamId: 'team-B1' },
        ],
        feasibilityScore: 78,
        recommendationRank: 3,
        expectedCompletionDate: '2024-01-17T18:00:00Z',
      },
    ];
    jest.spyOn(optimizerModule, 'generateAllocationPlans').mockResolvedValue(mockAllocationPlans);

    // ステップ8: 承認判定のスタブ化（スコア≥autoApprovalThreshold の案を自動承認）
    const mockApprovalResult = {
      autoApprovedPlans: [
        {
          planId: 'plan-001',
          feasibilityScore: 92,
          approvalStatus: 'auto_approved' as const,
        },
        {
          planId: 'plan-002',
          feasibilityScore: 85,
          approvalStatus: 'auto_approved' as const,
        },
      ],
      plansForApprovalReview: [
        {
          planId: 'plan-003',
          feasibilityScore: 78,
          approvalStatus: 'pending_review' as const,
        },
      ],
      rejectedPlans: [],
      approvalTimestamp: '2024-01-15T10:06:00Z',
    };
    jest.spyOn(approvalModule, 'judgeAllocationPlanApprovalWithCriteria').mockImplementation((plans, threshold) => {
      // autoApprovalThreshold パラメータを使用
      const approved = plans.filter(p => p.feasibilityScore >= threshold);
      const forReview = plans.filter(p => p.feasibilityScore < threshold);
      return Promise.resolve({
        autoApprovedPlans: approved.map(p => ({
          planId: p.planId,
          feasibilityScore: p.feasibilityScore,
          approvalStatus: 'auto_approved' as const,
        })),
        plansForApprovalReview: forReview.map(p => ({
          planId: p.planId,
          feasibilityScore: p.feasibilityScore,
          approvalStatus: 'pending_review' as const,
        })),
        rejectedPlans: [],
        approvalTimestamp: '2024-01-15T10:06:00Z',
      });
    });

    // ステップ9: 配置指示変換のスタブ化（承認された配置案のみ変換）
    jest.spyOn(deliveryModule, 'deliverAllocationPlanAndWorkInstructions').mockImplementation((approvedPlans) => {
      // approvedPlans のみが変換対象
      const convertedInstructions = approvedPlans.map((plan, index) => ({
        instructionId: `instr-${index + 1}`,
        planId: plan.planId,
        targetFieldLeaderId: `leader-${plan.facilityId}`,
        workInstructions: plan.proposedAllocations ? 
          plan.proposedAllocations.map(alloc => ({
            workerId: alloc.workerId,
            action: `Move from ${alloc.sourceTeamId} to ${alloc.targetTeamId}`,
          })) : [],
      }));
      return Promise.resolve({
        convertedInstructions,
      });
    });

    // ステップ10: 配信のスタブ化（配信成功・配信ID・配信時刻を含む）
    const deliveryTimestamp = new Date().toISOString();
    const mockDeliveryResult = {
      deliveryStatus: 'success' as const,
      deliveredPlans: mockTargetFacilityIds.map(facilityId => ({
        planId: 'plan-001',
        fieldLeaderId: `leader-${facilityId}`,
        deliveryMethod: facilityId === 'facility-B' ? 'sms' : 'email',
        deliveryTimestamp: deliveryTimestamp,
      })),
      failedDeliveries: [],
      deliveryTimestamp: deliveryTimestamp,
    };
    jest.spyOn(notificationModule, 'deliverAllocationInstructionToFieldLeader').mockResolvedValue(mockDeliveryResult);

    // ステップ11: 監査ログ記録のスタブ化
    jest.spyOn(authModule, 'recordOperationAudit').mockResolvedValue({
      auditId: 'audit-001',
      recordedAt: '2024-01-15T10:08:00Z',
    });

    // ステップ12: エージェント実行
    const result = await runTx6Imp1Agent(
      mockUserId,
      mockOrderSurgeEvent,
      mockTargetFacilityIds,
      mockAnalysisTimeWindowMinutes,
      mockAutoApprovalThreshold,
    );

    // ステップ13: 検証
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');
    expect(result.orderSurgeEventId).toBe(mockOrderSurgeEvent.eventId);

    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult.targetFacilities).toHaveLength(3);
    expect(result.analysisResult.targetFacilities.map(f => f.facilityId)).toEqual(expect.arrayContaining(mockTargetFacilityIds));
    expect(result.analysisResult.bottleneckAnalysis.criticalBottlenecks.length).toBeGreaterThan(0);
    expect(result.analysisResult.bottleneckAnalysis.staffingGapsByTeam.length).toBeGreaterThan(0);

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(result.generatedAllocationPlans).toHaveLength(3);
    expect(result.generatedAllocationPlans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feasibilityScore: 92, recommendationRank: 1 }),
        expect.objectContaining({ feasibilityScore: 85, recommendationRank: 2 }),
        expect.objectContaining({ feasibilityScore: 78, recommendationRank: 3 }),
      ])
    );

    // 仕様検証: 自動承認案はすべてスコア≥80
    expect(result.approvalResult).toBeDefined();
    expect(result.approvalResult.autoApprovedPlans).toHaveLength(2);
    result.approvalResult.autoApprovedPlans.forEach(plan => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(mockAutoApprovalThreshold);
    });
    expect(result.approvalResult.autoApprovedPlans.map(p => p.planId)).toEqual(
      expect.arrayContaining(['plan-001', 'plan-002'])
    );

    // 仕様検証: 承認者提示案はすべてスコア<80
    expect(result.approvalResult.plansForApprovalReview).toHaveLength(1);
    result.approvalResult.plansForApprovalReview.forEach(plan => {
      expect(plan.feasibilityScore).toBeLessThan(mockAutoApprovalThreshold);
    });
    expect(result.approvalResult.plansForApprovalReview.map(p => p.planId)).toContain('plan-003');

    // 仕様検証: 配信結果の検証
    expect(result.deliveryResult).toBeDefined();
    expect(result.deliveryResult.deliveryStatus).toBe('success');
    expect(result.deliveryResult.deliveredPlans).toHaveLength(3);

    // 配信先が targetFacilityIds 内の各拠点リーダーであることを検証
    const deliveredFieldLeaderIds = result.deliveryResult.deliveredPlans.map(plan => plan.fieldLeaderId);
    mockTargetFacilityIds.forEach(facilityId => {
      expect(deliveredFieldLeaderIds).toContain(`leader-${facilityId}`);
    });

    // 仕様検証: 配信ID・配信時刻（ISO 8601形式）を検証
    result.deliveryResult.deliveredPlans.forEach(deliveredPlan => {
      expect(deliveredPlan.deliveryTimestamp).toBeDefined();
      expect(typeof deliveredPlan.deliveryTimestamp).toBe('string');
      // ISO 8601形式チェック
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(deliveredPlan.deliveryTimestamp)).toBe(true);
    });

    // 仕様検証: executionTimestamp は現在時刻付近のISO 8601形式
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    // ISO 8601形式チェック
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(result.executionTimestamp)).toBe(true);
    // 現在時刻付近チェック（±5分以内）
    const resultTime = new Date(result.executionTimestamp).getTime();
    const currentTime = Date.now();
    const timeDiff = Math.abs(resultTime - currentTime);
    expect(timeDiff).toBeLessThan(5 * 60 * 1000); // 5分以内

    expect(result.errorDetails).toBeNull();

    // モック呼び出しの検証
    expect(authModule.authorizeOperation).toHaveBeenCalledWith(mockUserId, expect.any(Array));
    expect(persistenceModule.listProgressDataByCondition).toHaveBeenCalled();
    expect(persistenceModule.listProductivityDataByCondition).toHaveBeenCalled();
    expect(persistenceModule.getWorkerWithProficiencyAndProductivity).toHaveBeenCalled();
    expect(aggregationModule.aggregateWorkResultsAndCalculateProductivity).toHaveBeenCalled();
    expect(optimizerModule.generateAllocationPlans).toHaveBeenCalled();
    expect(approvalModule.judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(deliveryModule.deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(notificationModule.deliverAllocationInstructionToFieldLeader).toHaveBeenCalled();
  });
});