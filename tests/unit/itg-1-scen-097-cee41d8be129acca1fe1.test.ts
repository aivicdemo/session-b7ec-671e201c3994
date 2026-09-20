import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { Tx6Imp1AgentInput, Tx6Imp1AgentOutput, OrderSurgeEvent, AllocationPlanProposal, AllocationPlanApprovalResult } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-097: 生成された配置案が承認基準を満たさず、AllocationPlanApprovalFailureエラーでexecutionStatusがpartial_successとなり承認者へ提示される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListProgressDataByCondition: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockAggregateWorkResultsAndCalculateProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  const testUserId = 'user-123';
  const testOrderSurgeEvent: OrderSurgeEvent = {
    eventId: 'event-001',
    facilityId: 'facility-001',
    detectionTimestamp: '2024-01-15T10:00:00Z',
    surgeQuantity: 500,
    surgePercentage: 150
  };
  const testTargetFacilityIds = ['facility-001', 'facility-002', 'facility-003'];
  const testAnalysisTimeWindowMinutes = 60;
  const testAutoApprovalThreshold = 80;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      authorized: true,
      permissions: ['read:progress', 'read:productivity', 'write:allocation_plan', 'execute:allocation_instruction']
    });

    mockListProgressDataByCondition = jest.fn().mockResolvedValue([
      {
        facilityId: 'facility-001',
        teamId: 'team-001',
        currentProgressRate: 45,
        plannedProgressRate: 60,
        delayDays: 1
      },
      {
        facilityId: 'facility-002',
        teamId: 'team-002',
        currentProgressRate: 55,
        plannedProgressRate: 60,
        delayDays: 0
      },
      {
        facilityId: 'facility-003',
        teamId: 'team-003',
        currentProgressRate: 30,
        plannedProgressRate: 60,
        delayDays: 2
      }
    ]);

    mockListProductivityDataByCondition = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-001',
        averageProductivityRate: 85,
        qualityScore: 90,
        capacityUtilization: 95
      },
      {
        workerId: 'worker-002',
        averageProductivityRate: 70,
        qualityScore: 80,
        capacityUtilization: 80
      }
    ]);

    mockAggregateWorkResultsAndCalculateProductivity = jest.fn().mockResolvedValue({
      analysisTimestamp: '2024-01-15T11:00:00Z',
      targetFacilities: [
        {
          facilityId: 'facility-001',
          facilityName: 'Facility 1',
          teams: [
            {
              teamId: 'team-001',
              teamName: 'Team 1',
              currentProgressRate: 45,
              plannedProgressRate: 60,
              delayDays: 1,
              currentHeadcount: 5,
              recommendedHeadcount: 8
            }
          ],
          overallProgressRate: 45,
          delayRiskLevel: 'high'
        }
      ],
      productivityInsights: [
        {
          workerId: 'worker-001',
          workerName: 'Worker One',
          teamId: 'team-001',
          proficiencyLevel: '上級',
          averageProductivityRate: 85,
          qualityScore: 90,
          strongWorkTypes: ['assembly', 'quality_check'],
          capacityUtilization: 95
        }
      ],
      bottleneckAnalysis: {
        criticalBottlenecks: [
          {
            bottleneckId: 'bn-001',
            workInstructionId: 'wi-001',
            severity: 'high',
            rootCause: '人員不足',
            recommendedAction: '追加人員の配置'
          }
        ],
        staffingGapsByTeam: [
          {
            teamId: 'team-001',
            currentHeadcount: 5,
            requiredHeadcount: 8,
            gap: 3,
            requiredProficiencyLevels: ['中級', '上級']
          }
        ],
        priorityAdjustmentRecommendations: [
          {
            workInstructionId: 'wi-001',
            currentPriority: 2,
            recommendedPriority: 1,
            rationale: '納期が迫っているため優先度を上げるべき'
          }
        ]
      }
    });

    const allocationPlan1: AllocationPlanProposal = {
      planId: 'plan-001',
      planName: 'Allocation Plan 1',
      description: 'Plan with low feasibility score',
      targetFacilityId: 'facility-001',
      targetTeamId: 'team-001',
      allocations: [
        {
          workerId: 'worker-001',
          fromFacilityId: 'facility-002',
          toFacilityId: 'facility-001',
          startDate: '2024-01-15T12:00:00Z',
          endDate: '2024-01-20T18:00:00Z'
        }
      ],
      expectedCompletionDate: '2024-01-20T18:00:00Z',
      feasibilityScore: 65,
      recommendationRank: 1
    };

    const allocationPlan2: AllocationPlanProposal = {
      planId: 'plan-002',
      planName: 'Allocation Plan 2',
      description: 'Plan with medium feasibility score',
      targetFacilityId: 'facility-001',
      targetTeamId: 'team-001',
      allocations: [
        {
          workerId: 'worker-002',
          fromFacilityId: 'facility-003',
          toFacilityId: 'facility-001',
          startDate: '2024-01-15T12:00:00Z',
          endDate: '2024-01-19T18:00:00Z'
        }
      ],
      expectedCompletionDate: '2024-01-19T18:00:00Z',
      feasibilityScore: 75,
      recommendationRank: 2
    };

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([allocationPlan1, allocationPlan2]);

    const rejectionReasons = [
      { planId: 'plan-001', reason: '人員配置案が承認基準を満たしません。承認者の判断が必要です。' },
      { planId: 'plan-002', reason: '人員配置案が承認基準を満たしません。承認者の判断が必要です。' }
    ];

    const approvalResult: AllocationPlanApprovalResult = {
      approvalStatus: 'rejected',
      autoApprovedPlans: [],
      presentedToApproverPlans: ['plan-001', 'plan-002'],
      rejectedPlans: rejectionReasons,
      approverComments: '人員配置案が承認基準を満たしません。承認者の判断が必要です。'
    };

    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue(approvalResult);

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'audit-001',
      timestamp: '2024-01-15T11:00:00Z'
    });
  });

  it('should return partial_success when allocation plans do not meet approval criteria', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.executionStatus).toBe('partial_success');
  });

  it('should set orderSurgeEventId correctly', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.orderSurgeEventId).toBe(testOrderSurgeEvent.eventId);
  });

  it('should include analysisResult with ProgressAndProductivityAnalysisResult type', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.analysisResult).toBeDefined();
    expect(output.analysisResult.analysisTimestamp).toBeDefined();
    expect(output.analysisResult.targetFacilities).toBeDefined();
    expect(Array.isArray(output.analysisResult.targetFacilities)).toBe(true);
    expect(output.analysisResult.productivityInsights).toBeDefined();
    expect(Array.isArray(output.analysisResult.productivityInsights)).toBe(true);
    expect(output.analysisResult.bottleneckAnalysis).toBeDefined();
  });

  it('should include generatedAllocationPlans with multiple proposals', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBeGreaterThan(0);
    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeDefined();
      expect(plan.recommendationRank).toBeDefined();
    });
  });

  it('should include approvalResult with rejection reasons and presented plans', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.approvalResult).toBeDefined();
    expect(output.approvalResult.approvalStatus).toBe('rejected');
    expect(output.approvalResult.rejectedPlans).toBeDefined();
    expect(Array.isArray(output.approvalResult.rejectedPlans)).toBe(true);
    expect(output.approvalResult.rejectedPlans.length).toBeGreaterThan(0);
    output.approvalResult.rejectedPlans.forEach((rejection) => {
      expect(rejection.reason).toBe('人員配置案が承認基準を満たしません。承認者の判断が必要です。');
    });
    expect(output.approvalResult.presentedToApproverPlans).toBeDefined();
    expect(Array.isArray(output.approvalResult.presentedToApproverPlans)).toBe(true);
    expect(output.approvalResult.presentedToApproverPlans.length).toBeGreaterThan(0);
  });

  it('should have deliveryResult indicating no delivery due to approval pending', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.deliveryResult).toBeDefined();
    const isDeliveryNotAttempted = output.deliveryResult === null || 
      (output.deliveryResult && output.deliveryResult.deliveredPlans && output.deliveryResult.deliveredPlans.length === 0) ||
      (output.deliveryResult && output.deliveryResult.deliveryStatus === 'failure');
    expect(isDeliveryNotAttempted).toBe(true);
  });

  it('should have executionTimestamp in ISO 8601 format', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.executionTimestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(output.executionTimestamp)).toBe(true);
  });

  it('should have null or empty errorDetails for partial_success status', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.errorDetails === null || output.errorDetails?.length === 0).toBe(true);
  });

  it('should record operation audit with partial_success status', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(mockRecordOperationAudit).toHaveBeenCalled();
    const auditCall = mockRecordOperationAudit.mock.calls[0];
    expect(auditCall[0]).toContain('partial_success');
  });

  it('should handle approval rejection and present plans to approver', async () => {
    const input: Tx6Imp1AgentInput = {
      userId: testUserId,
      orderSurgeEvent: testOrderSurgeEvent,
      targetFacilityIds: testTargetFacilityIds,
      analysisTimeWindowMinutes: testAnalysisTimeWindowMinutes,
      autoApprovalThreshold: testAutoApprovalThreshold
    };

    const output = await runTx6Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResultsAndCalculateProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      recordOperationAudit: mockRecordOperationAudit
    });

    expect(output.approvalResult.autoApprovedPlans.length).toBe(0);
    expect(output.approvalResult.presentedToApproverPlans.length).toBeGreaterThan(0);
    expect(output.approvalResult.presentedToApproverPlans).toContain('plan-001');
    expect(output.approvalResult.presentedToApproverPlans).toContain('plan-002');
  });
});