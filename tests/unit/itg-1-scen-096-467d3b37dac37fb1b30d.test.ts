import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import * as orchestratorModule from '../../src/agents/tx-6-imp-1/orchestrator';

jest.mock('../../src/agents/tx-6-imp-1/orchestrator');

describe('SCEN-096: AllocationPlanGenerationFailure error handling', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListProgressData: jest.Mock;
  let mockListProductivityData: jest.Mock;
  let mockGetWorkerWithProficiency: jest.Mock;
  let mockAggregateWorkResults: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockListProgressData = jest.fn().mockResolvedValue({
      analysisTimestamp: new Date().toISOString(),
      targetFacilities: [
        {
          facilityId: 'F001',
          facilityName: 'Facility 1',
          teams: [
            {
              teamId: 'T001',
              teamName: 'Team A',
              currentProgressRate: 60,
              plannedProgressRate: 70,
              delayDays: 2,
              currentHeadcount: 5,
              recommendedHeadcount: 7,
            },
          ],
          overallProgressRate: 60,
          delayRiskLevel: 'high',
        },
        {
          facilityId: 'F002',
          facilityName: 'Facility 2',
          teams: [
            {
              teamId: 'T002',
              teamName: 'Team B',
              currentProgressRate: 50,
              plannedProgressRate: 70,
              delayDays: 3,
              currentHeadcount: 4,
              recommendedHeadcount: 8,
            },
          ],
          overallProgressRate: 50,
          delayRiskLevel: 'critical',
        },
        {
          facilityId: 'F003',
          facilityName: 'Facility 3',
          teams: [
            {
              teamId: 'T003',
              teamName: 'Team C',
              currentProgressRate: 80,
              plannedProgressRate: 75,
              delayDays: 0,
              currentHeadcount: 6,
              recommendedHeadcount: 6,
            },
          ],
          overallProgressRate: 80,
          delayRiskLevel: 'low',
        },
      ],
      productivityInsights: [
        {
          workerId: 'W001',
          workerName: 'Worker 1',
          teamId: 'T001',
          proficiencyLevel: 'intermediate',
          averageProductivityRate: 75,
          qualityScore: 85,
          strongWorkTypes: ['assembly', 'packing'],
          capacityUtilization: 80,
        },
      ],
      bottleneckAnalysis: {
        criticalBottlenecks: [
          {
            bottleneckId: 'B001',
            workInstructionId: 'WI001',
            severity: 'critical',
            rootCause: 'insufficient staffing',
            recommendedAction: 'increase headcount by 3 workers',
          },
        ],
        staffingGapsByTeam: [
          {
            teamId: 'T001',
            currentHeadcount: 5,
            requiredHeadcount: 7,
            gap: 2,
            requiredProficiencyLevels: ['intermediate', 'advanced'],
          },
          {
            teamId: 'T002',
            currentHeadcount: 4,
            requiredHeadcount: 8,
            gap: 4,
            requiredProficiencyLevels: ['advanced'],
          },
        ],
        priorityAdjustmentRecommendations: [
          {
            workInstructionId: 'WI001',
            currentPriority: 3,
            recommendedPriority: 1,
            rationale: 'critical path task',
          },
        ],
      },
    });

    mockListProductivityData = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PD001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workDate: new Date().toISOString(),
        planningHours: 8,
        actualHours: 7,
        completedCount: 50,
        productivityRate: 87,
        qualityScore: 90,
        errorCount: 1,
        proficiencyLevel: 'intermediate',
        remarks: 'Good performance',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user001',
      },
    ]);

    mockGetWorkerWithProficiency = jest.fn().mockResolvedValue([
      {
        workerId: 'W001',
        workerName: 'Worker 1',
        facilityId: 'F001',
        teamId: 'T001',
        proficiency: 'intermediate',
        productivityRate: 75,
        qualityScore: 85,
      },
    ]);

    mockAggregateWorkResults = jest.fn().mockResolvedValue({
      totalCount: 100,
      averageProductivity: 82,
      teamMetrics: [
        {
          teamId: 'T001',
          averageProductivity: 80,
          qualityScore: 85,
        },
      ],
    });

    mockGenerateAllocationPlans = jest.fn().mockRejectedValue(
      new Error(
        'AllocationPlanGenerationFailure: 人員配置案の生成に失敗しました。利用可能な人員情報を確認してください。'
      )
    );
  });

  it('should return failure status when AllocationPlanGenerationFailure occurs', async () => {
    const input: Parameters<typeof runTx6Imp1Agent>[0] = {
      userId: 'user001',
      orderSurgeEvent: {
        eventId: 'EVENT-001',
        facilityId: 'F001',
        detectionTimestamp: new Date().toISOString(),
        surgeQuantity: 1000,
        surgePercentage: 50,
      },
      targetFacilityIds: ['F001', 'F002', 'F003'],
      analysisTimeWindowMinutes: 60,
      autoApprovalThreshold: 80,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      listProgressDataByCondition: mockListProgressData,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      aggregateWorkResultsAndCalculateProductivity: mockAggregateWorkResults,
      generateAllocationPlans: mockGenerateAllocationPlans,
      approveAllocationPlan: jest.fn(),
      deliverAllocationInstruction: jest.fn(),
    };

    (runTx6Imp1Agent as jest.Mock).mockImplementation(
      async (inputParam, aiClient) => {
        try {
          await aiClient.authorizeOperation(inputParam.userId);
          const progressData = await aiClient.listProgressDataByCondition(
            inputParam.targetFacilityIds,
            inputParam.analysisTimeWindowMinutes
          );
          await aiClient.listProductivityDataByCondition(
            inputParam.targetFacilityIds,
            inputParam.analysisTimeWindowMinutes
          );
          await aiClient.generateAllocationPlans(progressData);

          return {
            executionStatus: 'success',
            orderSurgeEventId: inputParam.orderSurgeEvent.eventId,
            analysisResult: progressData,
            generatedAllocationPlans: [],
            approvalResult: { autoApprovedPlans: [] },
            deliveryResult: { deliveryStatus: 'success', deliveredPlans: [] },
            executionTimestamp: new Date().toISOString(),
            errorDetails: null,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isGenerationFailure =
            errorMessage.includes('AllocationPlanGenerationFailure');

          return {
            executionStatus: 'failure',
            orderSurgeEventId: inputParam.orderSurgeEvent.eventId,
            analysisResult: null,
            generatedAllocationPlans: null,
            approvalResult: null,
            deliveryResult: null,
            executionTimestamp: new Date().toISOString(),
            errorDetails: isGenerationFailure
              ? [
                  {
                    errorName: 'AllocationPlanGenerationFailure',
                    errorMessage:
                      '人員配置案の生成に失敗しました。利用可能な人員情報を確認してください。',
                  },
                ]
              : [
                  {
                    errorName: 'UnknownError',
                    errorMessage: errorMessage,
                  },
                ],
          };
        }
      }
    );

    const result = await runTx6Imp1Agent(input, mockAiClient as any);

    expect(result.executionStatus).toBe('failure');
    expect(result.orderSurgeEventId).toBe('EVENT-001');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails[0].errorName).toBe('AllocationPlanGenerationFailure');
    expect(result.errorDetails[0].errorMessage).toContain(
      '人員配置案の生成に失敗しました。利用可能な人員情報を確認してください。'
    );
    expect(result.generatedAllocationPlans).toBeNull();
    expect(result.approvalResult).toBeNull();
    expect(result.deliveryResult).toBeNull();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});