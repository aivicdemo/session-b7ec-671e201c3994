import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as orchestratorModule from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-050: 境界値系：facilityIds・teamIds・approverUserIdが指定されない場合', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockSaveDelayRiskJudgment: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    
    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockImplementation(
      (facilityIds, teamIds) => {
        // 全拠点・全チーム対象（null/undefined）の場合、複数拠点・複数チームの作業者を返す
        if (facilityIds === null || facilityIds === undefined) {
          return Promise.resolve([
            {
              workerId: 'worker-1',
              workerName: 'Worker A',
              proficiencyLevel: 'intermediate',
              currentProductivityRate: 85,
              facilityId: 'facility-1',
              teamId: 'team-1',
            },
            {
              workerId: 'worker-2',
              workerName: 'Worker B',
              proficiencyLevel: 'advanced',
              currentProductivityRate: 92,
              facilityId: 'facility-2',
              teamId: 'team-2',
            },
          ]);
        }
        return Promise.resolve([]);
      }
    );

    mockMonitorAndJudgeDelayRisk = jest.fn().mockImplementation(
      (facilityIds, teamIds, riskThreshold) => {
        // facilityIds=null、teamIds=nullで呼ばれた場合、全拠点・全チームの判定結果を返す
        if (facilityIds === null && teamIds === null) {
          return Promise.resolve([
            {
              riskJudgmentId: 'risk-1',
              facilityId: 'facility-1',
              teamId: 'team-1',
              workInstructionId: 'instruction-1',
              riskLevel: 'high',
              riskScore: 75,
              delayPredictionDays: 2,
              currentProgressRate: 40,
              plannedProgressRate: 60,
              delayReasonClassification: 'personnel_shortage',
            },
            {
              riskJudgmentId: 'risk-2',
              facilityId: 'facility-2',
              teamId: 'team-2',
              workInstructionId: 'instruction-2',
              riskLevel: 'medium',
              riskScore: 55,
              delayPredictionDays: 1,
              currentProgressRate: 55,
              plannedProgressRate: 70,
              delayReasonClassification: 'efficiency_decline',
            },
          ]);
        }
        return Promise.resolve([]);
      }
    );

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'plan-1',
        facilityId: 'facility-1',
        teamId: 'team-1',
        workInstructionId: 'instruction-1',
        proposedWorkerAssignments: [
          {
            workerId: 'worker-1',
            workerName: 'Worker A',
            proficiencyLevel: 'intermediate',
            assignedTaskDifficulty: 'medium',
            allocatedWorkHours: 8,
            expectedProductivityRate: 85,
          },
        ],
        expectedCompletionDate: '2025-12-20',
        feasibilityScore: 88,
        recommendationReason: 'Personnel allocation to address shortage',
        proficiencyAdjustmentApplied: true,
      },
      {
        allocationPlanId: 'plan-2',
        facilityId: 'facility-2',
        teamId: 'team-2',
        workInstructionId: 'instruction-2',
        proposedWorkerAssignments: [
          {
            workerId: 'worker-2',
            workerName: 'Worker B',
            proficiencyLevel: 'advanced',
            assignedTaskDifficulty: 'hard',
            allocatedWorkHours: 6,
            expectedProductivityRate: 92,
          },
        ],
        expectedCompletionDate: '2025-12-19',
        feasibilityScore: 82,
        recommendationReason: 'Efficiency improvement through skill match',
        proficiencyAdjustmentApplied: true,
      },
    ]);

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockImplementation((plans, context) => {
        // approverUserId=undefinedの場合、自動承認基準を適用して自動承認を返す
        if (context.approverUserId === undefined) {
          return Promise.resolve('auto_approved');
        }
        return Promise.resolve('pending_approval');
      });

    mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockResolvedValue([
        {
          facilityId: 'facility-1',
          teamId: 'team-1',
          workInstructionId: 'instruction-1',
          deliveryStatus: 'delivered',
          deliveryTimestamp: '2025-12-15T10:30:00Z',
        },
        {
          facilityId: 'facility-2',
          teamId: 'team-2',
          workInstructionId: 'instruction-2',
          deliveryStatus: 'delivered',
          deliveryTimestamp: '2025-12-15T10:32:00Z',
        },
      ]);

    mockSaveDelayRiskJudgment = jest.fn().mockResolvedValue(true);
    mockSaveAllocationPlan = jest.fn().mockResolvedValue(true);
    mockRecordOperationAudit = jest.fn().mockResolvedValue(true);

    jest.spyOn(orchestratorModule, 'authorizeOperation' as any).mockImplementation(mockAuthorizeOperation);
    jest.spyOn(orchestratorModule, 'getWorkerWithProficiencyAndProductivity' as any).mockImplementation(mockGetWorkerWithProficiencyAndProductivity);
    jest.spyOn(orchestratorModule, 'monitorAndJudgeDelayRisk' as any).mockImplementation(mockMonitorAndJudgeDelayRisk);
    jest.spyOn(orchestratorModule, 'generateAllocationPlans' as any).mockImplementation(mockGenerateAllocationPlans);
    jest.spyOn(orchestratorModule, 'judgeAllocationPlanApprovalWithCriteria' as any).mockImplementation(mockJudgeAllocationPlanApprovalWithCriteria);
    jest.spyOn(orchestratorModule, 'deliverAllocationPlanAndWorkInstructions' as any).mockImplementation(mockDeliverAllocationPlanAndWorkInstructions);
    jest.spyOn(orchestratorModule, 'saveDelayRiskJudgment' as any).mockImplementation(mockSaveDelayRiskJudgment);
    jest.spyOn(orchestratorModule, 'saveAllocationPlan' as any).mockImplementation(mockSaveAllocationPlan);
    jest.spyOn(orchestratorModule, 'recordOperationAudit' as any).mockImplementation(mockRecordOperationAudit);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('facilityIds・teamIds・approverUserIdが指定されない場合、全拠点・全チームを対象に処理が完了する', async () => {
    const input = {
      userId: 'user-123',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'scheduled_monitoring',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);

    result.delayRiskJudgmentResults.forEach((risk) => {
      expect(risk.facilityId).toBeDefined();
      expect(risk.teamId).toBeDefined();
      expect(risk.workInstructionId).toBeDefined();
      expect(risk.riskLevel).toBeDefined();
    });

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);

    result.generatedAllocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.proposedWorkerAssignments.length).toBeGreaterThan(0);
    });

    expect(
      result.approvalStatus === 'auto_approved' ||
        result.approvalStatus === 'pending_approval'
    ).toBe(true);

    expect(result.deliveryResults).toBeDefined();
    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBeGreaterThan(0);

    result.deliveryResults.forEach((delivery) => {
      expect(delivery.facilityId).toBeDefined();
      expect(delivery.teamId).toBeDefined();
      expect(delivery.workInstructionId).toBeDefined();
      expect(delivery.deliveryStatus).toBeDefined();
    });

    expect(result.executionStatus).toBe('success');

    expect(result.errorDetails === undefined || result.errorDetails === null).toBe(true);

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();

    // 全拠点・全チーム対象の処理が実行されたことを検証
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user-123');

    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalledWith(
      null,
      null
    );

    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalledWith(
      null,
      null,
      70
    );

    expect(mockGenerateAllocationPlans).toHaveBeenCalledWith(
      expect.arrayContaining(result.delayRiskJudgmentResults),
      expect.any(Object)
    );

    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledWith(
      expect.arrayContaining(result.generatedAllocationPlans),
      expect.objectContaining({
        approverUserId: undefined,
      })
    );

    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalledWith(
      expect.arrayContaining(result.generatedAllocationPlans),
      expect.arrayContaining(result.delayRiskJudgmentResults),
      expect.any(Object)
    );

    expect(mockSaveDelayRiskJudgment).toHaveBeenCalled();
    expect(mockSaveAllocationPlan).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('全拠点・全チーム対象で複数件のリスク判定結果と配置案が返される', async () => {
    const input = {
      userId: 'user-456',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'manual_trigger',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    result.delayRiskJudgmentResults.forEach((risk) => {
      expect(risk.facilityId).toBeDefined();
      expect(risk.teamId).toBeDefined();
      expect(risk.workInstructionId).toBeDefined();
      expect(risk.riskLevel).toMatch(/^(high|medium|low)$/);
      expect(risk.riskScore).toBeGreaterThanOrEqual(0);
      expect(risk.riskScore).toBeLessThanOrEqual(100);
      expect(risk.delayPredictionDays).toBeDefined();
      expect(risk.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(risk.currentProgressRate).toBeLessThanOrEqual(100);
      expect(risk.plannedProgressRate).toBeGreaterThanOrEqual(0);
      expect(risk.plannedProgressRate).toBeLessThanOrEqual(100);
      expect(risk.delayReasonClassification).toMatch(
        /^(personnel_shortage|efficiency_decline|priority_error)$/
      );
    });

    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);
    result.generatedAllocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.proposedWorkerAssignments.length).toBeGreaterThan(0);
      expect(plan.expectedCompletionDate).toMatch(
        /^\d{4}-\d{2}-\d{2}(T|$)/
      );
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.proficiencyAdjustmentApplied).toBe('boolean');
    });
  });

  it('承認状態が自動承認であることを確認', async () => {
    const input = {
      userId: 'user-789',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'scheduled_monitoring',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(result.approvalStatus).toBe('auto_approved');
  });

  it('配置指示が複数拠点・複数チームに配信されたことを確認', async () => {
    const input = {
      userId: 'user-999',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'scheduled_monitoring',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(result.deliveryResults.length).toBeGreaterThan(0);
    result.deliveryResults.forEach((delivery) => {
      expect(delivery.facilityId).toBeDefined();
      expect(delivery.teamId).toBeDefined();
      expect(delivery.workInstructionId).toBeDefined();
      expect(delivery.deliveryStatus).toBe('delivered');
      expect(delivery.deliveryTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      );
    });
  });

  it('実行ステータスがsuccessで返されることを確認', async () => {
    const input = {
      userId: 'user-111',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'scheduled_monitoring',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.errorDetails === undefined || result.errorDetails === null).toBe(true);
  });

  it('実行IDと実行タイムスタンプの形式を確認', async () => {
    const input = {
      userId: 'user-222',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'scheduled_monitoring',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it('getWorkerWithProficiencyAndProductivityが全拠点・全チーム対象で呼ばれることを確認', async () => {
    const input = {
      userId: 'user-333',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'scheduled_monitoring',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    await runTx3Imp1Agent(input, aiClient);

    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalledWith(null, null);
  });

  it('自動承認基準がapproverUserId=undefinedで適用されることを確認', async () => {
    const input = {
      userId: 'user-444',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: 70,
      approverUserId: undefined,
      executionContext: 'scheduled_monitoring',
    };

    const aiClient = {
      generateDelayRiskPrompt: jest.fn(),
      analyzeAllocationPrompt: jest.fn(),
      judgeApprovalPrompt: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        approverUserId: undefined,
      })
    );

    expect(result.approvalStatus).toBe('auto_approved');
  });
});