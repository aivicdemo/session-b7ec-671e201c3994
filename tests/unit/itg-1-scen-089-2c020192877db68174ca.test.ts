import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-089: 複数の割当案が生成されたとき、出力の generatedAllocationPlanIds に優先度順で複数のIDが返される', () => {
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
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockGetWorkerById = jest.fn().mockResolvedValue({
      workerId: 'WORKER-001',
      workerName: 'Test Worker',
      status: 'active',
    });
    mockGetLatestProductivityDataByWorker = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PROD-001',
        workDate: '2024-01-01T00:00:00Z',
        productivityRate: 85,
        qualityScore: 90,
        jobType: 'assembly',
      },
      {
        productivityDataId: 'PROD-002',
        workDate: '2024-01-02T00:00:00Z',
        productivityRate: 88,
        qualityScore: 92,
        jobType: 'assembly',
      },
      {
        productivityDataId: 'PROD-003',
        workDate: '2024-01-03T00:00:00Z',
        productivityRate: 82,
        qualityScore: 88,
        jobType: 'inspection',
      },
      {
        productivityDataId: 'PROD-004',
        workDate: '2024-01-04T00:00:00Z',
        productivityRate: 90,
        qualityScore: 91,
        jobType: 'assembly',
      },
      {
        productivityDataId: 'PROD-005',
        workDate: '2024-01-05T00:00:00Z',
        productivityRate: 86,
        qualityScore: 89,
        jobType: 'inspection',
      },
      {
        productivityDataId: 'PROD-006',
        workDate: '2024-01-06T00:00:00Z',
        productivityRate: 87,
        qualityScore: 91,
        jobType: 'assembly',
      },
    ]);
    mockGetLatestProficiencyByWorkerAndJobType = jest.fn().mockResolvedValue([
      {
        jobType: 'assembly',
        proficiencyLevel: 'intermediate',
        evaluationDate: '2024-01-06T00:00:00Z',
        dataSource: 'productivity_analysis',
      },
      {
        jobType: 'inspection',
        proficiencyLevel: 'beginner',
        evaluationDate: '2024-01-06T00:00:00Z',
        dataSource: 'productivity_analysis',
      },
    ]);
    mockListWorkInstructionsByCondition = jest.fn().mockResolvedValue([
      {
        workInstructionId: 'WI-001',
        taskName: 'Assembly Task 1',
        requiredSkills: ['assembly'],
      },
      {
        workInstructionId: 'WI-002',
        taskName: 'Inspection Task 1',
        requiredSkills: ['inspection'],
      },
      {
        workInstructionId: 'WI-003',
        taskName: 'Assembly Task 2',
        requiredSkills: ['assembly'],
      },
    ]);
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'PLAN-001',
        priority: 1,
        expectedProductivity: 87,
        jobTypeSequence: ['assembly', 'inspection'],
        difficultyLevel: 'normal',
      },
      {
        allocationPlanId: 'PLAN-002',
        priority: 2,
        expectedProductivity: 84,
        jobTypeSequence: ['inspection', 'assembly'],
        difficultyLevel: 'easy',
      },
      {
        allocationPlanId: 'PLAN-003',
        priority: 3,
        expectedProductivity: 80,
        jobTypeSequence: ['assembly'],
        difficultyLevel: 'challenging',
      },
    ]);
    mockExtractAndRankAllocationPlansForReview = jest.fn().mockResolvedValue([
      'PLAN-001',
      'PLAN-002',
      'PLAN-003',
    ]);
    mockSaveAllocationPlan = jest.fn()
      .mockResolvedValueOnce({ success: true, allocationPlanId: 'PLAN-001' })
      .mockResolvedValueOnce({ success: true, allocationPlanId: 'PLAN-002' })
      .mockResolvedValueOnce({ success: true, allocationPlanId: 'PLAN-003' });
    mockDeliverAllocationInstructionToFieldLeader = jest.fn().mockResolvedValue({
      success: true,
      deliveryId: 'DELIVERY-001',
      notificationRecipients: ['APPROVER-001', 'APPROVER-002'],
      deliveryTimestamp: '2024-01-06T10:00:00Z',
    });
    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      success: true,
      auditId: 'AUDIT-001',
    });

    jest.doMock('../../src/agents/tx-5-imp-1/dependencies', () => ({
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    }));
  });

  afterEach(() => {
    jest.doUnmock('../../src/agents/tx-5-imp-1/dependencies');
  });

  test('複数の割当案が優先度順で返される', async () => {
    const input: Tx5Imp1AgentInput = {
      workerId: 'WORKER-001',
      executingUserId: 'USER-ADMIN-001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result.success).toBe(true);
    expect(result.workerId).toBe('WORKER-001');
    expect(result.generatedAllocationPlanIds).toEqual(['PLAN-001', 'PLAN-002', 'PLAN-003']);
    expect(result.generatedAllocationPlanIds.length).toBeGreaterThanOrEqual(3);
    expect(result.generatedAllocationPlanIds[0]).toBe('PLAN-001');
    expect(result.generatedAllocationPlanIds[1]).toBe('PLAN-002');
    expect(result.generatedAllocationPlanIds[2]).toBe('PLAN-003');

    expect(result.productivityPatternSummary).toBeDefined();
    expect(result.productivityPatternSummary.analysisStartDate).toBeDefined();
    expect(result.productivityPatternSummary.analysisEndDate).toBeDefined();
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBeGreaterThanOrEqual(5);
    expect(result.productivityPatternSummary.averageProductivityRate).toBeGreaterThanOrEqual(0);
    expect(result.productivityPatternSummary.averageProductivityRate).toBeLessThanOrEqual(100);
    expect(result.productivityPatternSummary.averageQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.productivityPatternSummary.averageQualityScore).toBeLessThanOrEqual(100);

    expect(result.proficiencyLevelByJobType).toBeDefined();
    expect(Array.isArray(result.proficiencyLevelByJobType)).toBe(true);
    expect(result.proficiencyLevelByJobType.length).toBeGreaterThan(0);

    expect(result.recommendedDifficultyAdjustment).toBeDefined();
    expect(result.recommendedDifficultyAdjustment.recommendedInitialDifficulty).toBeDefined();
    expect(['easy', 'normal', 'challenging']).toContain(result.recommendedDifficultyAdjustment.recommendedInitialDifficulty);
    expect(result.recommendedDifficultyAdjustment.difficultyAdjustmentRationale).toBeDefined();
    expect(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence).toBeDefined();
    expect(Array.isArray(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence)).toBe(true);
    expect(result.recommendedDifficultyAdjustment.mentorshipRecommendation).toBeDefined();

    expect(result.approvalNotificationSent).toBe(true);
    expect(result.approvalNotificationRecipients).toBeDefined();
    expect(Array.isArray(result.approvalNotificationRecipients)).toBe(true);
    expect(result.approvalNotificationRecipients.length).toBeGreaterThanOrEqual(1);

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    expect(() => new Date(result.executionTimestamp)).not.toThrow();

    expect(result.errorDetails).toBeNull();
  });
});