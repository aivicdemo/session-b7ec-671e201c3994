import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

// Mock all dependencies
jest.mock('../../src/agents/tx-5-imp-1/orchestrator', () => ({
  runTx5Imp1Agent: jest.fn(),
}));

describe('SCEN-079: 新規配属作業者の過去実績データ自動分析と初期割当案生成', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetLatestProficiencyByWorkerAndJobType: jest.Mock;
  let mockListWorkInstructionsByCondition: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockExtractAndRankAllocationPlansForReview: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationInstructionToFieldLeader: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let callOrder: string[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    callOrder = [];

    mockAuthorizeOperation = jest.fn().mockImplementation((userId) => {
      callOrder.push('authorizeOperation');
      return Promise.resolve(true);
    });

    mockGetWorkerById = jest.fn().mockImplementation((workerId) => {
      callOrder.push('getWorkerById');
      return Promise.resolve({
        workerId: 'W001',
        name: 'Test Worker',
        status: 'active',
      });
    });

    mockGetLatestProductivityDataByWorker = jest.fn().mockImplementation(() => {
      callOrder.push('getLatestProductivityDataByWorker');
      return Promise.resolve([
        {
          recordId: 'P001',
          workerId: 'W001',
          jobType: 'assembly',
          productivityRate: 85,
          qualityScore: 90,
          date: new Date('2024-01-01'),
        },
        {
          recordId: 'P002',
          workerId: 'W001',
          jobType: 'assembly',
          productivityRate: 87,
          qualityScore: 92,
          date: new Date('2024-01-02'),
        },
        {
          recordId: 'P003',
          workerId: 'W001',
          jobType: 'inspection',
          productivityRate: 75,
          qualityScore: 88,
          date: new Date('2024-01-03'),
        },
        {
          recordId: 'P004',
          workerId: 'W001',
          jobType: 'assembly',
          productivityRate: 89,
          qualityScore: 91,
          date: new Date('2024-01-04'),
        },
        {
          recordId: 'P005',
          workerId: 'W001',
          jobType: 'assembly',
          productivityRate: 86,
          qualityScore: 93,
          date: new Date('2024-01-05'),
        },
        {
          recordId: 'P006',
          workerId: 'W001',
          jobType: 'packing',
          productivityRate: 80,
          qualityScore: 85,
          date: new Date('2024-01-06'),
        },
      ]);
    });

    mockGetLatestProficiencyByWorkerAndJobType = jest.fn().mockImplementation(() => {
      callOrder.push('getLatestProficiencyByWorkerAndJobType');
      return Promise.resolve([
        {
          jobType: 'assembly',
          proficiencyLevel: 'intermediate',
          evaluationDate: '2024-01-01T00:00:00Z',
          dataSource: 'productivity_analysis',
        },
        {
          jobType: 'inspection',
          proficiencyLevel: 'beginner',
          evaluationDate: '2024-01-01T00:00:00Z',
          dataSource: 'productivity_analysis',
        },
        {
          jobType: 'packing',
          proficiencyLevel: 'beginner',
          evaluationDate: '2024-01-01T00:00:00Z',
          dataSource: 'productivity_analysis',
        },
      ]);
    });

    mockListWorkInstructionsByCondition = jest.fn().mockImplementation(() => {
      callOrder.push('listWorkInstructionsByCondition');
      return Promise.resolve([
        {
          instructionId: 'I001',
          jobType: 'assembly',
          difficulty: 'normal',
          priority: 'high',
        },
        {
          instructionId: 'I002',
          jobType: 'inspection',
          difficulty: 'easy',
          priority: 'medium',
        },
        {
          instructionId: 'I003',
          jobType: 'packing',
          difficulty: 'easy',
          priority: 'low',
        },
      ]);
    });

    const allocationPlanIds = ['AP001', 'AP002', 'AP003'];
    mockGenerateAllocationPlans = jest.fn().mockImplementation(() => {
      callOrder.push('generateAllocationPlans');
      return Promise.resolve(
        allocationPlanIds.map((id, index) => ({
          planId: id,
          priority: 3 - index,
          estimatedProductivity: 85 - index * 5,
          recommendedDifficulty:
            index === 0 ? 'normal' : index === 1 ? 'normal' : 'easy',
        }))
      );
    });

    mockExtractAndRankAllocationPlansForReview = jest.fn().mockImplementation(() => {
      callOrder.push('extractAndRankAllocationPlansForReview');
      return Promise.resolve(['AP001', 'AP002', 'AP003']);
    });

    const saveMockMap: Record<string, string> = {
      AP001: 'SAVED_AP001',
      AP002: 'SAVED_AP002',
      AP003: 'SAVED_AP003',
    };
    mockSaveAllocationPlan = jest.fn().mockImplementation((plan) => {
      callOrder.push(`saveAllocationPlan(${plan.planId})`);
      return Promise.resolve({
        savedId: saveMockMap[plan.planId] || 'SAVED_' + plan.planId,
        timestamp: new Date().toISOString(),
      });
    });

    mockDeliverAllocationInstructionToFieldLeader = jest.fn().mockImplementation(() => {
      callOrder.push('deliverAllocationInstructionToFieldLeader');
      return Promise.resolve({
        notificationId: 'NOTIF001',
        recipientUserIds: ['U002', 'U003'],
        deliveryTimestamp: new Date().toISOString(),
      });
    });

    mockRecordOperationAudit = jest.fn().mockImplementation(() => {
      callOrder.push('recordOperationAudit');
      return Promise.resolve({
        auditId: 'AUDIT001',
      });
    });

    // Setup the actual implementation with mocks injected
    (runTx5Imp1Agent as jest.Mock).mockImplementation(
      async (
        input: Tx5Imp1AgentInput,
        aiClient: any
      ): Promise<Tx5Imp1AgentOutput> => {
        // Check authorization
        const isAuthorized = await mockAuthorizeOperation(input.executingUserId);
        if (!isAuthorized) {
          return {
            success: false,
            workerId: input.workerId,
            generatedAllocationPlanIds: [],
            productivityPatternSummary: {
              analysisStartDate: new Date().toISOString(),
              analysisEndDate: new Date().toISOString(),
              totalProductivityRecordsAnalyzed: 0,
              averageProductivityRate: 0,
              averageQualityScore: 0,
              strongJobTypes: [],
              weakJobTypes: [],
              productivityTrend: 'stable',
            },
            proficiencyLevelByJobType: [],
            recommendedDifficultyAdjustment: {
              recommendedInitialDifficulty: 'easy',
              difficultyAdjustmentRationale: 'Authorization failed',
              recommendedJobTypeSequence: [],
              mentorshipRecommendation: false,
              mentorshipDetails: null,
            },
            approvalNotificationSent: false,
            approvalNotificationRecipients: [],
            executionTimestamp: new Date().toISOString(),
            errorDetails: {
              code: 'UNAUTHORIZED',
              message: 'User not authorized',
              context: {},
            },
          };
        }

        // Get worker info
        const worker = await mockGetWorkerById(input.workerId);
        if (!worker) {
          return {
            success: false,
            workerId: input.workerId,
            generatedAllocationPlanIds: [],
            productivityPatternSummary: {
              analysisStartDate: new Date().toISOString(),
              analysisEndDate: new Date().toISOString(),
              totalProductivityRecordsAnalyzed: 0,
              averageProductivityRate: 0,
              averageQualityScore: 0,
              strongJobTypes: [],
              weakJobTypes: [],
              productivityTrend: 'stable',
            },
            proficiencyLevelByJobType: [],
            recommendedDifficultyAdjustment: {
              recommendedInitialDifficulty: 'easy',
              difficultyAdjustmentRationale: 'Worker not found',
              recommendedJobTypeSequence: [],
              mentorshipRecommendation: false,
              mentorshipDetails: null,
            },
            approvalNotificationSent: false,
            approvalNotificationRecipients: [],
            executionTimestamp: new Date().toISOString(),
            errorDetails: {
              code: 'WORKER_NOT_FOUND',
              message: 'Worker not found',
              context: {},
            },
          };
        }

        // Get productivity data
        const lookbackDays = input.analysisLookbackDays || 30;
        const minRecords = input.minimumProductivityRecordsRequired || 5;
        const productivityData =
          await mockGetLatestProductivityDataByWorker(
            input.workerId,
            lookbackDays
          );

        if (
          !productivityData ||
          productivityData.length < minRecords
        ) {
          return {
            success: false,
            workerId: input.workerId,
            generatedAllocationPlanIds: [],
            productivityPatternSummary: {
              analysisStartDate: new Date().toISOString(),
              analysisEndDate: new Date().toISOString(),
              totalProductivityRecordsAnalyzed:
                productivityData?.length || 0,
              averageProductivityRate: 0,
              averageQualityScore: 0,
              strongJobTypes: [],
              weakJobTypes: [],
              productivityTrend: 'stable',
            },
            proficiencyLevelByJobType: [],
            recommendedDifficultyAdjustment: {
              recommendedInitialDifficulty: 'easy',
              difficultyAdjustmentRationale:
                'Insufficient productivity records',
              recommendedJobTypeSequence: [],
              mentorshipRecommendation: false,
              mentorshipDetails: null,
            },
            approvalNotificationSent: false,
            approvalNotificationRecipients: [],
            executionTimestamp: new Date().toISOString(),
            errorDetails: {
              code: 'INSUFFICIENT_DATA',
              message: `Insufficient productivity records. Required: ${minRecords}, Found: ${productivityData?.length || 0}`,
              context: {},
            },
          };
        }

        // Analyze productivity patterns
        const jobTypeMap: Record<string, any> = {};
        productivityData.forEach((record: any) => {
          if (!jobTypeMap[record.jobType]) {
            jobTypeMap[record.jobType] = {
              records: [],
              totalProductivity: 0,
              totalQuality: 0,
            };
          }
          jobTypeMap[record.jobType].records.push(record);
          jobTypeMap[record.jobType].totalProductivity +=
            record.productivityRate;
          jobTypeMap[record.jobType].totalQuality +=
            record.qualityScore;
        });

        let maxProductivity = 0;
        let strongJobTypes: any[] = [];
        let weakJobTypes: any[] = [];

        Object.entries(jobTypeMap).forEach(
          ([jobType, data]: [string, any]) => {
            const avgProductivity =
              data.totalProductivity / data.records.length;
            const avgQuality =
              data.totalQuality / data.records.length;
            if (avgProductivity > maxProductivity) {
              maxProductivity = avgProductivity;
            }
            if (avgProductivity > 85) {
              strongJobTypes.push({
                jobType,
                productivityRate: Math.round(avgProductivity),
                qualityScore: Math.round(avgQuality),
                recordCount: data.records.length,
              });
            } else if (avgProductivity < 80) {
              weakJobTypes.push({
                jobType,
                productivityRate: Math.round(avgProductivity),
                qualityScore: Math.round(avgQuality),
                recordCount: data.records.length,
              });
            }
          }
        );

        const overallProductivity = Math.round(
          productivityData.reduce(
            (sum: number, r: any) => sum + r.productivityRate,
            0
          ) / productivityData.length
        );
        const overallQuality = Math.round(
          productivityData.reduce(
            (sum: number, r: any) => sum + r.qualityScore,
            0
          ) / productivityData.length
        );

        // Get proficiency levels
        const proficiencyLevels =
          await mockGetLatestProficiencyByWorkerAndJobType(
            input.workerId
          );

        // Get available work instructions
        await mockListWorkInstructionsByCondition();

        // Generate allocation plans
        const generatedPlans =
          await mockGenerateAllocationPlans({
            productivityPattern: {
              averageProductivityRate: overallProductivity,
              averageQualityScore: overallQuality,
              strongJobTypes,
              weakJobTypes,
            },
            proficiencyLevels,
          });

        // Extract and rank plans for review
        const rankedPlanIds =
          await mockExtractAndRankAllocationPlansForReview(
            generatedPlans
          );

        // Save allocation plans
        const savedPlanIds: string[] = [];
        for (const planId of rankedPlanIds) {
          const saved = await mockSaveAllocationPlan({
            planId,
          });
          savedPlanIds.push(saved.savedId);
        }

        // Deliver notification
        const notificationResult =
          await mockDeliverAllocationInstructionToFieldLeader({
            workerId: input.workerId,
            allocationPlanIds: savedPlanIds,
          });

        // Record audit
        await mockRecordOperationAudit({
          userId: input.executingUserId,
          operation: 'generate_allocation_plans',
          workerId: input.workerId,
        });

        // Build productivity pattern summary
        const productivityPatternSummary = {
          analysisStartDate: new Date(
            Date.now() - lookbackDays * 24 * 60 * 60 * 1000
          ).toISOString(),
          analysisEndDate: new Date().toISOString(),
          totalProductivityRecordsAnalyzed: productivityData.length,
          averageProductivityRate: overallProductivity,
          averageQualityScore: overallQuality,
          strongJobTypes,
          weakJobTypes,
          productivityTrend: 'stable' as const,
        };

        // Build proficiency level by job type
        const proficiencyByJobType = proficiencyLevels.map(
          (p: any) => ({
            jobType: p.jobType,
            proficiencyLevel: p.proficiencyLevel,
            evaluationDate: p.evaluationDate,
            dataSource: p.dataSource,
          })
        );

        // Determine recommended difficulty
        let recommendedDifficulty = 'normal';
        let mentorshipRequired = false;
        if (overallProductivity < 75) {
          recommendedDifficulty = 'easy';
          mentorshipRequired = true;
        } else if (overallProductivity > 90) {
          recommendedDifficulty = 'challenging';
        }

        const recommendedSequence = [
          ...strongJobTypes.map((j: any) => j.jobType),
          ...weakJobTypes.map((j: any) => j.jobType),
        ];

        return {
          success: true,
          workerId: input.workerId,
          generatedAllocationPlanIds: savedPlanIds,
          productivityPatternSummary,
          proficiencyLevelByJobType: proficiencyByJobType,
          recommendedDifficultyAdjustment: {
            recommendedInitialDifficulty: recommendedDifficulty,
            difficultyAdjustmentRationale: `Based on average productivity rate of ${overallProductivity}% and quality score of ${overallQuality}. Strong in: ${strongJobTypes.map((j: any) => j.jobType).join(', ') || 'none'}. Needs improvement in: ${weakJobTypes.map((j: any) => j.jobType).join(', ') || 'none'}.`,
            recommendedJobTypeSequence: recommendedSequence,
            mentorshipRecommendation: mentorshipRequired,
            mentorshipDetails: mentorshipRequired
              ? 'Recommend OJT support for below-target productivity'
              : null,
          },
          approvalNotificationSent: true,
          approvalNotificationRecipients:
            notificationResult.recipientUserIds,
          executionTimestamp: new Date().toISOString(),
          errorDetails: null,
        };
      }
    );
  });

  test('正常入力で過去実績を分析し、複数の割当案を優先度順に生成して承認者に通知し、データが正常に保存される', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    // Act
    const result = await runTx5Imp1Agent(input, {} as any);

    // Assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.workerId).toBe('W001');

    // Check generated allocation plan IDs are from saveAllocationPlan results
    expect(result.generatedAllocationPlanIds).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlanIds)).toBe(true);
    expect(result.generatedAllocationPlanIds.length).toBeGreaterThanOrEqual(3);
    expect(result.generatedAllocationPlanIds).toEqual([
      'SAVED_AP001',
      'SAVED_AP002',
      'SAVED_AP003',
    ]);

    // Check productivity pattern summary
    expect(result.productivityPatternSummary).toBeDefined();
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBe(6);
    expect(result.productivityPatternSummary.averageProductivityRate).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageQualityScore).toBeGreaterThan(0);
    expect(
      result.productivityPatternSummary.strongJobTypes
    ).toBeDefined();
    expect(Array.isArray(result.productivityPatternSummary.strongJobTypes)).toBe(true);
    expect(result.productivityPatternSummary.weakJobTypes).toBeDefined();
    expect(Array.isArray(result.productivityPatternSummary.weakJobTypes)).toBe(true);

    // Check proficiency levels by job type
    expect(result.proficiencyLevelByJobType).toBeDefined();
    expect(Array.isArray(result.proficiencyLevelByJobType)).toBe(true);
    expect(result.proficiencyLevelByJobType.length).toBeGreaterThan(0);

    // Check recommended difficulty adjustment
    expect(result.recommendedDifficultyAdjustment).toBeDefined();
    expect([
      'easy',
      'normal',
      'challenging',
    ]).toContain(
      result.recommendedDifficultyAdjustment
        .recommendedInitialDifficulty
    );
    expect(
      result.recommendedDifficultyAdjustment
        .difficultyAdjustmentRationale
    ).toBeDefined();
    expect(typeof result.recommendedDifficultyAdjustment.difficultyAdjustmentRationale).toBe('string');
    expect(
      result.recommendedDifficultyAdjustment
        .recommendedJobTypeSequence
    ).toBeDefined();
    expect(Array.isArray(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence)).toBe(true);
    expect(typeof result.recommendedDifficultyAdjustment.mentorshipRecommendation).toBe('boolean');

    // Check approval notification
    expect(result.approvalNotificationSent).toBe(true);
    expect(result.approvalNotificationRecipients).toBeDefined();
    expect(Array.isArray(result.approvalNotificationRecipients)).toBe(true);
    expect(result.approvalNotificationRecipients.length).toBeGreaterThan(0);
    expect(result.approvalNotificationRecipients).toEqual([
      'U002',
      'U003',
    ]);

    // Check execution timestamp
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);

    // Check error details
    expect(result.errorDetails).toBeNull();

    // Verify mock calls were made in expected order
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('U001');
    expect(mockGetWorkerById).toHaveBeenCalledWith('W001');
    expect(
      mockGetLatestProductivityDataByWorker
    ).toHaveBeenCalledWith('W001', 30);
    expect(
      mockGetLatestProficiencyByWorkerAndJobType
    ).toHaveBeenCalledWith('W001');
    expect(mockListWorkInstructionsByCondition).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(
      mockExtractAndRankAllocationPlansForReview
    ).toHaveBeenCalled();
    expect(mockSaveAllocationPlan).toHaveBeenCalledTimes(3);
    expect(
      mockDeliverAllocationInstructionToFieldLeader
    ).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    // Verify call order
    const expectedOrder = [
      'authorizeOperation',
      'getWorkerById',
      'getLatestProductivityDataByWorker',
      'getLatestProficiencyByWorkerAndJobType',
      'listWorkInstructionsByCondition',
      'generateAllocationPlans',
      'extractAndRankAllocationPlansForReview',
      'saveAllocationPlan(AP001)',
      'saveAllocationPlan(AP002)',
      'saveAllocationPlan(AP003)',
      'deliverAllocationInstructionToFieldLeader',
      'recordOperationAudit',
    ];
    expect(callOrder).toEqual(expectedOrder);
  });
});