import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-085: DataPersistenceError during allocation plan save', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetLatestProficiencyByWorkerAndJobType: jest.Mock;
  let mockListWorkInstructionsByCondition: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockExtractAndRankAllocationPlansForReview: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockGetWorkerById = jest.fn().mockResolvedValue({
      workerId: 'WORKER-001',
      name: '新規配属者A',
      status: 'active',
    });
    mockGetLatestProductivityDataByWorker = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PROD-001',
        workerId: 'WORKER-001',
        productivityRate: 85,
        qualityScore: 90,
        recordDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        productivityDataId: 'PROD-002',
        workerId: 'WORKER-001',
        productivityRate: 88,
        qualityScore: 92,
        recordDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        productivityDataId: 'PROD-003',
        workerId: 'WORKER-001',
        productivityRate: 82,
        qualityScore: 88,
        recordDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        productivityDataId: 'PROD-004',
        workerId: 'WORKER-001',
        productivityRate: 90,
        qualityScore: 95,
        recordDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        productivityDataId: 'PROD-005',
        workerId: 'WORKER-001',
        productivityRate: 86,
        qualityScore: 91,
        recordDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    mockGetLatestProficiencyByWorkerAndJobType = jest.fn().mockResolvedValue([
      {
        jobType: 'assembly',
        proficiencyLevel: 'intermediate',
        evaluationDate: new Date().toISOString(),
        dataSource: 'productivity_analysis',
      },
      {
        jobType: 'inspection',
        proficiencyLevel: 'beginner',
        evaluationDate: new Date().toISOString(),
        dataSource: 'productivity_analysis',
      },
    ]);
    mockListWorkInstructionsByCondition = jest.fn().mockResolvedValue([
      {
        workInstructionId: 'WI-001',
        workName: 'assembly-task-1',
        status: 'pending',
      },
      {
        workInstructionId: 'WI-002',
        workName: 'inspection-task-1',
        status: 'pending',
      },
    ]);
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'AP-001',
        workerId: 'WORKER-001',
        recommendedJobType: 'assembly',
        priority: 1,
      },
      {
        allocationPlanId: 'AP-002',
        workerId: 'WORKER-001',
        recommendedJobType: 'assembly',
        priority: 2,
      },
      {
        allocationPlanId: 'AP-003',
        workerId: 'WORKER-001',
        recommendedJobType: 'inspection',
        priority: 3,
      },
    ]);
    mockExtractAndRankAllocationPlansForReview = jest.fn().mockResolvedValue({
      topPlans: [
        {
          allocationPlanId: 'AP-001',
          workerId: 'WORKER-001',
          recommendedJobType: 'assembly',
          priority: 1,
        },
        {
          allocationPlanId: 'AP-002',
          workerId: 'WORKER-001',
          recommendedJobType: 'assembly',
          priority: 2,
        },
        {
          allocationPlanId: 'AP-003',
          workerId: 'WORKER-001',
          recommendedJobType: 'inspection',
          priority: 3,
        },
      ],
    });
    mockSaveAllocationPlan = jest.fn().mockImplementation(() => {
      const error = new Error('割当案の保存に失敗しました。');
      (error as any).name = 'DataPersistenceError';
      throw error;
    });
  });

  it('should return error output when DataPersistenceError occurs during allocation plan save', async () => {
    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
    };

    const input = {
      workerId: 'WORKER-001',
      executingUserId: 'USER-ADMIN-001',
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const output = await runTx5Imp1Agent(input, aiClient);

    expect(output.success).toBe(false);
    expect(output.generatedAllocationPlanIds).toEqual([]);
    expect(output.approvalNotificationSent).toBe(false);
    expect(output.errorDetails).not.toBeNull();
    expect(output.errorDetails?.name).toBe('DataPersistenceError');
    expect(output.errorDetails?.message).toContain('割当案の保存に失敗しました。');
    expect(output.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});