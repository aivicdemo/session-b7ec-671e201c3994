import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import {
  Tx6Imp1AgentInput,
  Tx6Imp1AgentOutput,
  OrderSurgeEvent,
} from '../../src/agents/tx-6-imp-1/orchestrator';
import * as orchestrator from '../../src/agents/tx-6-imp-1/orchestrator';

// Mock dependencies
jest.mock('../../src/agents/tx-6-imp-1/orchestrator');

describe('SCEN-098: 現場リーダーへの配置指示配信に失敗したため、DeliveryInstructionFailureエラーで中断する', () => {
  it('should return failure status with DeliveryInstructionFailure error when field leader delivery fails', async () => {
    // Arrange
    const userId = 'user-001';
    const orderSurgeEvent: OrderSurgeEvent = {
      eventId: 'surge-event-001',
      facilityId: 'facility-001',
      detectionTimestamp: new Date().toISOString(),
      surgeQuantity: 500,
      surgePercentage: 150,
    };
    const targetFacilityIds = ['facility-001', 'facility-002'];
    const analysisTimeWindowMinutes = 60;
    const autoApprovalThreshold = 80;

    const input: Tx6Imp1AgentInput = {
      userId,
      orderSurgeEvent,
      targetFacilityIds,
      analysisTimeWindowMinutes,
      autoApprovalThreshold,
    };

    // Mock the expected output with failure status
    const mockOutput: Tx6Imp1AgentOutput = {
      executionStatus: 'failure',
      orderSurgeEventId: 'surge-event-001',
      executionTimestamp: new Date().toISOString(),
      analysisResult: {
        analysisTimestamp: new Date().toISOString(),
        targetFacilities: [
          {
            facilityId: 'facility-001',
            facilityName: 'Facility 1',
            teams: [
              {
                teamId: 'team-001',
                teamName: 'Team A',
                currentProgressRate: 75,
                plannedProgressRate: 80,
                delayDays: 1,
                currentHeadcount: 10,
                recommendedHeadcount: 12,
              },
            ],
            overallProgressRate: 75,
            delayRiskLevel: 'high',
          },
        ],
        productivityInsights: [
          {
            workerId: 'worker-001',
            workerName: 'Worker Name',
            teamId: 'team-001',
            proficiencyLevel: '上級',
            averageProductivityRate: 85,
            qualityScore: 90,
            strongWorkTypes: ['assembly', 'inspection'],
            capacityUtilization: 95,
          },
        ],
        bottleneckAnalysis: {
          criticalBottlenecks: [
            {
              bottleneckId: 'bottleneck-001',
              workInstructionId: 'work-001',
              severity: 'high',
              rootCause: '人員不足',
              recommendedAction: '配置人員の増加',
            },
          ],
          staffingGapsByTeam: [
            {
              teamId: 'team-001',
              currentHeadcount: 10,
              requiredHeadcount: 12,
              gap: 2,
              requiredProficiencyLevels: ['中級', '上級'],
            },
          ],
          priorityAdjustmentRecommendations: [
            {
              workInstructionId: 'work-001',
              currentPriority: 2,
              recommendedPriority: 1,
              rationale: '納期までの余裕が限定的',
            },
          ],
        },
      },
      generatedAllocationPlans: [
        {
          planId: 'plan-001',
          proposalTitle: 'Plan 1',
          targetFacilityId: 'facility-001',
          targetTeamId: 'team-001',
          allocatedWorkers: ['worker-001', 'worker-002'],
          expectedCompletionDate: new Date(
            Date.now() + 86400000,
          ).toISOString(),
          feasibilityScore: 85,
          recommendationReason: 'Optimal staffing arrangement',
          planStatus: 'proposed',
        },
      ],
      approvalResult: {
        approvalStatus: 'partial_approved',
        autoApprovedPlans: [
          {
            planId: 'plan-001',
            approvalTimestamp: new Date().toISOString(),
          },
        ],
        pendingApprovalPlans: [],
        rejectedPlans: [],
      },
      deliveryResult: {
        deliveryStatus: 'failure',
        deliveredPlans: [],
        failedDeliveries: [
          {
            planId: 'plan-001',
            targetFieldLeaderId: 'leader-001',
            errorMessage: '配置指示の配信に失敗しました。通知システムの状態を確認してください。',
            retryAttempts: 5,
          },
        ],
        deliveryTimestamp: new Date().toISOString(),
      },
      errorDetails: [
        {
          name: 'DeliveryInstructionFailure',
          message:
            '配置指示の配信に失敗しました。通知システムの状態を確認してください。',
          context: 'deliverAllocationInstructionToFieldLeader',
        },
      ],
    };

    (runTx6Imp1Agent as jest.Mock).mockResolvedValue(mockOutput);

    // Act
    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input, {} as any);

    // Assert
    expect(result.executionStatus).toBe('failure');
    expect(result.orderSurgeEventId).toBe('surge-event-001');
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails![0].name).toContain('DeliveryInstructionFailure');
    expect(result.errorDetails![0].message).toContain(
      '配置指示の配信に失敗しました。通知システムの状態を確認してください。',
    );
    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult.targetFacilities).toBeDefined();
    expect(result.analysisResult.targetFacilities.length).toBeGreaterThan(0);
    expect(result.generatedAllocationPlans).toBeDefined();
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);
    expect(result.approvalResult).toBeDefined();
    expect(result.deliveryResult).toBeDefined();
    expect(result.deliveryResult.deliveryStatus).toBe('failure');
    expect(result.deliveryResult.failedDeliveries.length).toBeGreaterThan(0);
  });
});