import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-088: 最小実績件数の要件をデフォルト5件以外で指定した場合、指定件数で判定が実行される', () => {
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

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockGetWorkerById = jest.fn().mockResolvedValue({
      id: 'W001',
      name: 'Test Worker',
      facilityId: 'F001',
      teamId: 'T001',
      status: 'active',
    });

    const productivityRecords = [
      {
        id: 'PR001',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-15',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 40,
        productivityRate: 95,
        qualityScore: 92,
        recordCount: 5,
      },
      {
        id: 'PR002',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-16',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 42,
        productivityRate: 98,
        qualityScore: 94,
        recordCount: 5,
      },
      {
        id: 'PR003',
        workerId: 'W001',
        jobType: 'inspection',
        workDate: '2024-01-17',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 35,
        productivityRate: 88,
        qualityScore: 89,
        recordCount: 5,
      },
    ];

    mockGetLatestProductivityDataByWorker = jest
      .fn()
      .mockResolvedValue(productivityRecords);

    mockGetLatestProficiencyByWorkerAndJobType = jest
      .fn()
      .mockResolvedValue([
        {
          jobType: 'assembly',
          proficiencyLevel: 'intermediate',
          evaluationDate: '2024-01-20',
          dataSource: 'productivity_analysis',
        },
        {
          jobType: 'inspection',
          proficiencyLevel: 'beginner',
          evaluationDate: '2024-01-20',
          dataSource: 'productivity_analysis',
        },
      ]);

    mockListWorkInstructionsByCondition = jest.fn().mockResolvedValue([
      {
        id: 'WI001',
        name: 'Assembly Task A',
        facilityId: 'F001',
        teamId: 'T001',
      },
      {
        id: 'WI002',
        name: 'Inspection Task B',
        facilityId: 'F001',
        teamId: 'T001',
      },
    ]);

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        id: 'AP001',
        workerId: 'W001',
        jobType: 'assembly',
        priority: 1,
        expectedProductivity: 95,
      },
      {
        id: 'AP002',
        workerId: 'W001',
        jobType: 'inspection',
        priority: 2,
        expectedProductivity: 88,
      },
    ]);

    mockExtractAndRankAllocationPlansForReview = jest
      .fn()
      .mockResolvedValue([
        {
          id: 'AP001',
          workerId: 'W001',
          jobType: 'assembly',
          priority: 1,
          expectedProductivity: 95,
          rank: 1,
        },
        {
          id: 'AP002',
          workerId: 'W001',
          jobType: 'inspection',
          priority: 2,
          expectedProductivity: 88,
          rank: 2,
        },
      ]);

    mockSaveAllocationPlan = jest
      .fn()
      .mockImplementation((plan) =>
        Promise.resolve({ ...plan, id: `AP_${Date.now()}` })
      );

    mockDeliverAllocationInstructionToFieldLeader = jest
      .fn()
      .mockResolvedValue({
        notificationId: 'NOTIF001',
        recipients: ['U002', 'U003'],
        sentAt: new Date().toISOString(),
      });

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'AUDIT001',
      timestamp: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute analysis with custom minimumProductivityRecordsRequired of 3 instead of default 5', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 3,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview:
        mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader:
        mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert
    expect(result.success).toBe(true);
    expect(result.workerId).toBe('W001');
    
    expect(result.generatedAllocationPlanIds).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlanIds)).toBe(true);
    expect(result.generatedAllocationPlanIds.length).toBeGreaterThan(0);
    expect(result.generatedAllocationPlanIds.length).toBeGreaterThanOrEqual(2);

    expect(result.productivityPatternSummary).toBeDefined();
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBe(3);
    expect(result.productivityPatternSummary.analysisStartDate).toBeDefined();
    expect(result.productivityPatternSummary.analysisEndDate).toBeDefined();
    expect(result.productivityPatternSummary.averageProductivityRate).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageProductivityRate).toBeLessThanOrEqual(100);
    expect(result.productivityPatternSummary.averageQualityScore).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageQualityScore).toBeLessThanOrEqual(100);
    expect(result.productivityPatternSummary.strongJobTypes).toBeDefined();
    expect(Array.isArray(result.productivityPatternSummary.strongJobTypes)).toBe(true);
    expect(result.productivityPatternSummary.weakJobTypes).toBeDefined();
    expect(Array.isArray(result.productivityPatternSummary.weakJobTypes)).toBe(true);
    expect(['improving', 'stable', 'declining']).toContain(result.productivityPatternSummary.productivityTrend);

    expect(result.proficiencyLevelByJobType).toBeDefined();
    expect(Array.isArray(result.proficiencyLevelByJobType)).toBe(true);
    expect(result.proficiencyLevelByJobType.length).toBeGreaterThan(0);
    result.proficiencyLevelByJobType.forEach((proficiency) => {
      expect(proficiency.jobType).toBeDefined();
      expect(typeof proficiency.jobType).toBe('string');
      expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(proficiency.proficiencyLevel);
      expect(proficiency.evaluationDate).toBeDefined();
      expect(['formal_evaluation', 'productivity_analysis', 'default']).toContain(proficiency.dataSource);
    });

    expect(result.recommendedDifficultyAdjustment).toBeDefined();
    expect(['easy', 'normal', 'challenging']).toContain(result.recommendedDifficultyAdjustment.recommendedInitialDifficulty);
    expect(result.recommendedDifficultyAdjustment.difficultyAdjustmentRationale).toBeDefined();
    expect(typeof result.recommendedDifficultyAdjustment.difficultyAdjustmentRationale).toBe('string');
    expect(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence).toBeDefined();
    expect(Array.isArray(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence)).toBe(true);
    expect(result.recommendedDifficultyAdjustment.mentorshipRecommendation).toBeDefined();
    expect(typeof result.recommendedDifficultyAdjustment.mentorshipRecommendation).toBe('boolean');
    if (result.recommendedDifficultyAdjustment.mentorshipDetails !== null) {
      expect(typeof result.recommendedDifficultyAdjustment.mentorshipDetails).toBe('string');
    }

    expect(result.approvalNotificationSent).toBe(true);
    expect(result.approvalNotificationRecipients).toBeDefined();
    expect(Array.isArray(result.approvalNotificationRecipients)).toBe(true);
    expect(result.approvalNotificationRecipients.length).toBeGreaterThan(0);
    result.approvalNotificationRecipients.forEach((recipientId) => {
      expect(typeof recipientId).toBe('string');
    });

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    const timestampDate = new Date(result.executionTimestamp);
    expect(timestampDate.getTime()).not.toBeNaN();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.errorDetails).toBeNull();

    // Verify that getLatestProductivityDataByWorker was called with correct parameters
    expect(mockGetLatestProductivityDataByWorker).toHaveBeenCalledWith('W001', 30);
  });

  test('should succeed when exactly 3 productivity records are available with minimumProductivityRecordsRequired=3', async () => {
    // Arrange - ensure only 3 records are returned
    const threeRecords = [
      {
        id: 'PR001',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-15',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 40,
        productivityRate: 95,
        qualityScore: 92,
        recordCount: 5,
      },
      {
        id: 'PR002',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-16',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 42,
        productivityRate: 98,
        qualityScore: 94,
        recordCount: 5,
      },
      {
        id: 'PR003',
        workerId: 'W001',
        jobType: 'inspection',
        workDate: '2024-01-17',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 35,
        productivityRate: 88,
        qualityScore: 89,
        recordCount: 5,
      },
    ];

    mockGetLatestProductivityDataByWorker.mockResolvedValueOnce(threeRecords);

    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 3,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview:
        mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader:
        mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert
    expect(result.success).toBe(true);
    expect(result.workerId).toBe('W001');
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBe(3);
    expect(result.errorDetails).toBeNull();
  });

  test('should fail when insufficient records exist compared to minimumProductivityRecordsRequired', async () => {
    // Arrange - return only 2 records when minimum of 3 is required
    const twoRecords = [
      {
        id: 'PR001',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-15',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 40,
        productivityRate: 95,
        qualityScore: 92,
        recordCount: 5,
      },
      {
        id: 'PR002',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-16',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 42,
        productivityRate: 98,
        qualityScore: 94,
        recordCount: 5,
      },
    ];

    mockGetLatestProductivityDataByWorker.mockResolvedValueOnce(twoRecords);

    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 3,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview:
        mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader:
        mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert - verification that the minimumProductivityRecordsRequired threshold is enforced
    expect(result.success).toBe(false);
    expect(result.errorDetails).not.toBeNull();
    expect(result.workerId).toBe('W001');
  });

  test('should use specified minimumProductivityRecordsRequired and not apply default 5', async () => {
    // Arrange - explicitly test that with minimumProductivityRecordsRequired=3,
    // the system accepts 3 records and does not require 5
    const threeRecords = [
      {
        id: 'PR001',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-15',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 40,
        productivityRate: 95,
        qualityScore: 92,
        recordCount: 5,
      },
      {
        id: 'PR002',
        workerId: 'W001',
        jobType: 'assembly',
        workDate: '2024-01-16',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 42,
        productivityRate: 98,
        qualityScore: 94,
        recordCount: 5,
      },
      {
        id: 'PR003',
        workerId: 'W001',
        jobType: 'inspection',
        workDate: '2024-01-17',
        plannedHours: 8,
        actualHours: 8,
        completedCount: 35,
        productivityRate: 88,
        qualityScore: 89,
        recordCount: 5,
      },
    ];

    mockGetLatestProductivityDataByWorker.mockResolvedValueOnce(threeRecords);

    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 3,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview:
        mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader:
        mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert
    // The key assertion: with minimumProductivityRecordsRequired=3, 3 records are sufficient
    // and analysis completes successfully without requiring 5 records
    expect(result.success).toBe(true);
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBe(3);
    expect(result.errorDetails).toBeNull();

    // Verify that the custom minimum was respected
    expect(mockGetLatestProductivityDataByWorker).toHaveBeenCalledWith('W001', 30);
  });

  test('should generate allocation plan IDs in priority order', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 3,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview:
        mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader:
        mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert - verify multiple allocation plan IDs in priority order
    expect(result.generatedAllocationPlanIds).toBeDefined();
    expect(result.generatedAllocationPlanIds.length).toBeGreaterThanOrEqual(2);
    expect(result.generatedAllocationPlanIds[0]).toBeDefined();
    expect(result.generatedAllocationPlanIds[1]).toBeDefined();
  });

  test('should include strong and weak job types from 3 productivity records', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 3,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview:
        mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader:
        mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert
    expect(result.productivityPatternSummary.strongJobTypes).toBeDefined();
    expect(result.productivityPatternSummary.weakJobTypes).toBeDefined();
    result.productivityPatternSummary.strongJobTypes.forEach((jobPerf) => {
      expect(jobPerf.jobType).toBeDefined();
      expect(typeof jobPerf.jobType).toBe('string');
      expect(jobPerf.productivityRate).toBeGreaterThan(0);
      expect(jobPerf.productivityRate).toBeLessThanOrEqual(100);
      expect(jobPerf.qualityScore).toBeGreaterThanOrEqual(0);
      expect(jobPerf.qualityScore).toBeLessThanOrEqual(100);
      expect(jobPerf.recordCount).toBeGreaterThan(0);
    });
    result.productivityPatternSummary.weakJobTypes.forEach((jobPerf) => {
      expect(jobPerf.jobType).toBeDefined();
      expect(typeof jobPerf.jobType).toBe('string');
      expect(jobPerf.productivityRate).toBeGreaterThan(0);
      expect(jobPerf.productivityRate).toBeLessThanOrEqual(100);
      expect(jobPerf.qualityScore).toBeGreaterThanOrEqual(0);
      expect(jobPerf.qualityScore).toBeLessThanOrEqual(100);
      expect(jobPerf.recordCount).toBeGreaterThan(0);
    });
  });

  test('should generate valid recommended difficulty adjustment with valid values', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 3,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType:
        mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview:
        mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader:
        mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert
    expect(result.recommendedDifficultyAdjustment.recommendedInitialDifficulty).toMatch(
      /^(easy|normal|challenging)$/
    );
    expect(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence).toBeInstanceOf(Array);
    result.recommendedDifficultyAdjustment.recommendedJobTypeSequence.forEach((jobType) => {
      expect(typeof jobType).toBe('string');
    });
  });
});