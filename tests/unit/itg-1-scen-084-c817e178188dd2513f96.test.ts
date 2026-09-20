import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-084: ApprovalPresentationFailedError when notification delivery fails', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetLatestProficiencyByWorkerAndJobType: jest.Mock;
  let mockListWorkInstructionsByCondition: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockExtractAndRankAllocationPlansForReview: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationInstructionToFieldLeader: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockGetWorkerById = jest.fn().mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      status: 'active',
    });
    mockGetLatestProductivityDataByWorker = jest.fn().mockResolvedValue([
      { recordId: 'P001', productivityRate: 85, qualityScore: 90, jobType: 'assembly' },
      { recordId: 'P002', productivityRate: 88, qualityScore: 92, jobType: 'assembly' },
      { recordId: 'P003', productivityRate: 80, qualityScore: 88, jobType: 'inspection' },
      { recordId: 'P004', productivityRate: 82, qualityScore: 89, jobType: 'inspection' },
      { recordId: 'P005', productivityRate: 86, qualityScore: 91, jobType: 'assembly' },
    ]);
    mockGetLatestProficiencyByWorkerAndJobType = jest.fn().mockResolvedValue([
      { jobType: 'assembly', proficiencyLevel: 'intermediate', evaluationDate: '2024-01-01T00:00:00Z', dataSource: 'productivity_analysis' },
      { jobType: 'inspection', proficiencyLevel: 'beginner', evaluationDate: '2024-01-01T00:00:00Z', dataSource: 'productivity_analysis' },
    ]);
    mockListWorkInstructionsByCondition = jest.fn().mockResolvedValue([
      { instructionId: 'I001', jobType: 'assembly', difficulty: 'normal' },
      { instructionId: 'I002', jobType: 'inspection', difficulty: 'easy' },
    ]);
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue({
      planIds: ['PLAN001', 'PLAN002', 'PLAN003'],
    });
    mockExtractAndRankAllocationPlansForReview = jest.fn().mockResolvedValue([
      { planId: 'PLAN001', rank: 1, expectedProductivity: 85 },
      { planId: 'PLAN002', rank: 2, expectedProductivity: 80 },
      { planId: 'PLAN003', rank: 3, expectedProductivity: 75 },
    ]);
    mockSaveAllocationPlan = jest.fn().mockResolvedValue({ saved: true });
    mockDeliverAllocationInstructionToFieldLeader = jest
      .fn()
      .mockRejectedValue(new Error('Failed to deliver allocation instruction to approval authority'));
  });

  it('should return success=false with ApprovalPresentationFailedError when notification delivery fails', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(result.success).toBe(false);
    expect(result.workerId).toBe('W001');
    expect(result.approvalNotificationSent).toBe(false);
    expect(
      result.approvalNotificationRecipients === null ||
        (Array.isArray(result.approvalNotificationRecipients) && result.approvalNotificationRecipients.length === 0)
    ).toBe(true);
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails?.errorCode).toBe('ApprovalPresentationFailedError');
    expect(result.errorDetails?.message).toBe('割当案を承認者へ提示できません。通知送信に失敗しました。');
    expect(result.generatedAllocationPlanIds).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlanIds)).toBe(true);
    expect(result.generatedAllocationPlanIds.length).toBeGreaterThan(0);
    expect(result.productivityPatternSummary).toBeDefined();
    expect(result.productivityPatternSummary.averageProductivityRate).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageQualityScore).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBeGreaterThanOrEqual(5);
    expect(result.proficiencyLevelByJobType).toBeDefined();
    expect(Array.isArray(result.proficiencyLevelByJobType)).toBe(true);
    expect(result.proficiencyLevelByJobType.length).toBeGreaterThan(0);
    expect(result.recommendedDifficultyAdjustment).toBeDefined();
    expect(result.recommendedDifficultyAdjustment.recommendedInitialDifficulty).toBeDefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should include partial results before notification failure', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(result.generatedAllocationPlanIds.length).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageProductivityRate).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageQualityScore).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBeGreaterThanOrEqual(
      5
    );
    expect(result.proficiencyLevelByJobType.length).toBeGreaterThan(0);
    expect(result.recommendedDifficultyAdjustment.recommendedInitialDifficulty).toBeDefined();
    expect(['easy', 'normal', 'challenging']).toContain(
      result.recommendedDifficultyAdjustment.recommendedInitialDifficulty
    );
  });

  it('should record error details when notification fails', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.errorCode).toBe('ApprovalPresentationFailedError');
    expect(result.errorDetails?.message).toContain('割当案を承認者へ提示できません');
  });

  it('should handle ApprovalPresentationFailedError exception', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(result.success).toBe(false);
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails!.errorCode).toBe('ApprovalPresentationFailedError');
  });

  it('should allow approvalNotificationRecipients to be null or empty array', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(
      result.approvalNotificationRecipients === null ||
        (Array.isArray(result.approvalNotificationRecipients) && result.approvalNotificationRecipients.length === 0)
    ).toBe(true);
  });

  it('should verify productivityPatternSummary contains valid analysis data', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(result.productivityPatternSummary.analysisStartDate).toBeDefined();
    expect(result.productivityPatternSummary.analysisEndDate).toBeDefined();
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBeGreaterThanOrEqual(5);
    expect(result.productivityPatternSummary.averageProductivityRate).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageProductivityRate).toBeLessThanOrEqual(100);
    expect(result.productivityPatternSummary.averageQualityScore).toBeGreaterThan(0);
    expect(result.productivityPatternSummary.averageQualityScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.productivityPatternSummary.strongJobTypes)).toBe(true);
    expect(Array.isArray(result.productivityPatternSummary.weakJobTypes)).toBe(true);
    expect(['improving', 'stable', 'declining']).toContain(result.productivityPatternSummary.productivityTrend);
  });

  it('should verify proficiencyLevelByJobType contains valid proficiency data', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    result.proficiencyLevelByJobType.forEach((proficiency) => {
      expect(proficiency.jobType).toBeDefined();
      expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(proficiency.proficiencyLevel);
      expect(proficiency.evaluationDate).toBeDefined();
      expect(['formal_evaluation', 'productivity_analysis', 'default']).toContain(proficiency.dataSource);
    });
  });

  it('should verify recommendedDifficultyAdjustment contains valid recommendation data', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'W001',
      executingUserId: 'U100',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, aiClient);

    expect(['easy', 'normal', 'challenging']).toContain(
      result.recommendedDifficultyAdjustment.recommendedInitialDifficulty
    );
    expect(result.recommendedDifficultyAdjustment.difficultyAdjustmentRationale).toBeDefined();
    expect(result.recommendedDifficultyAdjustment.difficultyAdjustmentRationale.length).toBeGreaterThan(0);
    expect(Array.isArray(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence)).toBe(true);
    expect(typeof result.recommendedDifficultyAdjustment.mentorshipRecommendation).toBe('boolean');
  });
});