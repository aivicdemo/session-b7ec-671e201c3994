import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

class WorkInstructionDeliveryFailedError extends Error {
  public readonly errorCode = 'WorkInstructionDeliveryFailedError';
  public readonly affectedResourceId: string;

  constructor(message: string, affectedResourceId: string) {
    super(message);
    this.name = 'WorkInstructionDeliveryFailedError';
    this.affectedResourceId = affectedResourceId;
    Object.setPrototypeOf(this, WorkInstructionDeliveryFailedError.prototype);
  }
}

describe('SCEN-026: WorkInstructionDeliveryFailedError when delivery fails after auto-approval', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockListProductivityData: jest.Mock;
  let mockGetWorkerWithProficiency: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApproval: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      authorized: true,
      userId: 'USER-001',
      permissions: ['auto_approve_allocation', 'deliver_instructions']
    });

    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue({
      valid: true,
      errors: []
    });

    mockListProductivityData = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PROD-001',
        workerId: 'WORKER-001',
        facilityId: 'FAC-001',
        workDate: '2024-01-15',
        completedCount: 120,
        workTimeMinutes: 480,
        productivityRate: 95,
        qualityScore: 90
      },
      {
        productivityDataId: 'PROD-002',
        workerId: 'WORKER-002',
        facilityId: 'FAC-001',
        workDate: '2024-01-20',
        completedCount: 100,
        workTimeMinutes: 480,
        productivityRate: 85,
        qualityScore: 88
      },
      {
        productivityDataId: 'PROD-003',
        workerId: 'WORKER-001',
        facilityId: 'FAC-001',
        workDate: '2024-01-22',
        completedCount: 130,
        workTimeMinutes: 480,
        productivityRate: 98,
        qualityScore: 92
      },
      {
        productivityDataId: 'PROD-004',
        workerId: 'WORKER-002',
        facilityId: 'FAC-001',
        workDate: '2024-01-25',
        completedCount: 115,
        workTimeMinutes: 480,
        productivityRate: 92,
        qualityScore: 89
      },
      {
        productivityDataId: 'PROD-005',
        workerId: 'WORKER-001',
        facilityId: 'FAC-001',
        workDate: '2024-01-28',
        completedCount: 125,
        workTimeMinutes: 480,
        productivityRate: 96,
        qualityScore: 91
      }
    ]);

    mockGetWorkerWithProficiency = jest.fn().mockResolvedValue([
      {
        workerId: 'WORKER-001',
        workerName: '太郎',
        facilityId: 'FAC-001',
        proficiencyLevel: 4,
        averageProductivity: 96
      },
      {
        workerId: 'WORKER-002',
        workerName: '花子',
        facilityId: 'FAC-001',
        proficiencyLevel: 3,
        averageProductivity: 90
      }
    ]);

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'PLAN-001',
        planName: '配置案1',
        feasibilityScore: 92,
        recommendedRank: 1,
        status: 'generated',
        expectedCompletionDate: '2024-02-05',
        allocatedWorkers: ['WORKER-001']
      },
      {
        allocationPlanId: 'PLAN-002',
        planName: '配置案2',
        feasibilityScore: 85,
        recommendedRank: 2,
        status: 'generated',
        expectedCompletionDate: '2024-02-08',
        allocatedWorkers: ['WORKER-002']
      }
    ]);

    mockJudgeAllocationPlanApproval = jest.fn()
      .mockResolvedValueOnce({
        allocationPlanId: 'PLAN-001',
        status: 'approved',
        approvalReason: '実現可能性スコアが90%を超えており、承認基準を満たす'
      })
      .mockResolvedValueOnce({
        allocationPlanId: 'PLAN-002',
        status: 'pending_approval',
        approvalReason: null,
        rejectionReason: '実現可能性スコアが90%以下のため、手動承認が必要です'
      });

    mockSaveAllocationPlan = jest.fn().mockResolvedValue({
      allocationPlanId: 'PLAN-001',
      saved: true,
      timestamp: new Date().toISOString()
    });

    mockDeliverAllocationPlan = jest.fn().mockRejectedValue(
      new WorkInstructionDeliveryFailedError(
        '配置指示の配信に失敗しました。手動配信を実施してください。',
        'PLAN-001'
      )
    );

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'AUDIT-001',
      recorded: true
    });
  });

  it('should throw WorkInstructionDeliveryFailedError when allocation plan delivery fails after auto-approval', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    try {
      await runTx2Imp2Agent(input, mockAiClient);
      fail('Expected WorkInstructionDeliveryFailedError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(WorkInstructionDeliveryFailedError);
      expect(error.message).toBe('配置指示の配信に失敗しました。手動配信を実施してください。');
      expect(error.errorCode).toBe('WorkInstructionDeliveryFailedError');
      expect(error.affectedResourceId).toBe('PLAN-001');

      const stack = error.stack || '';
      const stackLines = stack.split('\n');
      const deliverIndex = stackLines.findIndex(line =>
        line.includes('deliverAllocationPlanAndWorkInstructions')
      );
      const orchestratorIndex = stackLines.findIndex(line =>
        line.includes('runTx2Imp2Agent')
      );

      expect(deliverIndex).toBeGreaterThanOrEqual(0);
      expect(orchestratorIndex).toBeGreaterThanOrEqual(0);
      expect(deliverIndex).toBeLessThan(orchestratorIndex);
    }

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USER-001');
    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(input);
    expect(mockListProductivityData).toHaveBeenCalledWith({
      facilityId: 'FAC-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId: 'PLAN-001'
      })
    );
    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId: 'PLAN-001'
      })
    );
    expect(mockDeliverAllocationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId: 'PLAN-001'
      })
    );
  });

  it('should include error details with affected resource ID when delivery fails', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    try {
      await runTx2Imp2Agent(input, mockAiClient);
      fail('Expected WorkInstructionDeliveryFailedError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(WorkInstructionDeliveryFailedError);
      expect(error.affectedResourceId).toBe('PLAN-001');
      expect(error.message).toBe(
        '配置指示の配信に失敗しました。手動配信を実施してください。'
      );
      expect(error.errorCode).toBe('WorkInstructionDeliveryFailedError');
    }
  });

  it('should validate referential integrity on input parameters with correct format validation', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    try {
      await runTx2Imp2Agent(input, mockAiClient);
    } catch (error: any) {
      expect(error.message).not.toContain('入力パラメータが不正です');
    }

    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(input);
    const callArgs = mockValidateReferentialIntegrity.mock.calls[0][0];
    expect(callArgs.analysisStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(callArgs.analysisEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(callArgs.facilityId).toBeTruthy();
    expect(typeof callArgs.facilityId).toBe('string');
    expect(callArgs.executingUserId).toBeTruthy();
    expect(typeof callArgs.executingUserId).toBe('string');
    expect(typeof callArgs.autoApprovalEnabled).toBe('boolean');
  });

  it('should process allocation plans and auto-approve before delivery attempt', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    try {
      await runTx2Imp2Agent(input, mockAiClient);
    } catch (error) {
      // Expected to throw
    }

    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApproval).toHaveBeenCalledWith(
      expect.any(Object)
    );
    expect(mockJudgeAllocationPlanApproval).toHaveBeenCalledTimes(2);
    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId: 'PLAN-001'
      })
    );
  });

  it('should throw error with correct call chain from deliverAllocationPlanAndWorkInstructions to runTx2Imp2Agent', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    try {
      await runTx2Imp2Agent(input, mockAiClient);
      fail('Expected WorkInstructionDeliveryFailedError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(WorkInstructionDeliveryFailedError);
      const stack = error.stack || '';
      const stackLines = stack.split('\n');

      const deliverIndex = stackLines.findIndex(line =>
        line.includes('deliverAllocationPlanAndWorkInstructions')
      );
      const orchestratorIndex = stackLines.findIndex(line =>
        line.includes('runTx2Imp2Agent')
      );

      expect(deliverIndex).toBeGreaterThanOrEqual(0);
      expect(orchestratorIndex).toBeGreaterThanOrEqual(0);
      expect(deliverIndex).toBeLessThan(orchestratorIndex);
    }
  });

  it('should return partial success output with error details when delivery fails', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    let resultOutput: any = null;
    let thrownError: any = null;

    try {
      resultOutput = await runTx2Imp2Agent(input, mockAiClient);
    } catch (error: any) {
      thrownError = error;
    }

    if (resultOutput && resultOutput.status === 'partial_success') {
      expect(resultOutput.generatedAllocationPlans).toHaveLength(2);
      expect(resultOutput.autoApprovedPlans).toBeDefined();
      expect(resultOutput.autoApprovedPlans?.length).toBe(1);
      expect(resultOutput.autoApprovedPlans?.[0].allocationPlanId).toBe('PLAN-001');
      expect(resultOutput.errorDetails).toBeDefined();
      expect(Array.isArray(resultOutput.errorDetails)).toBe(true);

      const deliveryErrorDetail = resultOutput.errorDetails?.find(
        (err: any) => err.errorCode === 'WorkInstructionDeliveryFailedError'
      );
      expect(deliveryErrorDetail).toBeDefined();
      expect(deliveryErrorDetail?.errorMessage).toBe(
        '配置指示の配信に失敗しました。手動配信を実施してください。'
      );
      expect(deliveryErrorDetail?.affectedResourceId).toBe('PLAN-001');
      expect(
        typeof resultOutput.failedDeliveryCount === 'number' ||
        resultOutput.failedDeliveryCount === null
      ).toBe(true);
    } else if (thrownError) {
      expect(thrownError).toBeInstanceOf(WorkInstructionDeliveryFailedError);
    } else {
      fail('Expected either WorkInstructionDeliveryFailedError to be thrown or partial_success output');
    }
  });

  it('should record stack trace from deliverAllocationPlanAndWorkInstructions in error', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    try {
      await runTx2Imp2Agent(input, mockAiClient);
      fail('Expected WorkInstructionDeliveryFailedError to be thrown');
    } catch (error: any) {
      expect(error.stack).toBeDefined();
      const stackLines = error.stack.split('\n');

      const hasRunTx2Imp2Agent = stackLines.some(line =>
        line.includes('runTx2Imp2Agent')
      );
      const hasDeliverCall = stackLines.some(line =>
        line.includes('deliverAllocationPlanAndWorkInstructions')
      );

      expect(hasRunTx2Imp2Agent).toBe(true);
      expect(hasDeliverCall).toBe(true);

      const deliverIndex = stackLines.findIndex(line =>
        line.includes('deliverAllocationPlanAndWorkInstructions')
      );
      const orchestratorIndex = stackLines.findIndex(line =>
        line.includes('runTx2Imp2Agent')
      );

      if (deliverIndex >= 0 && orchestratorIndex >= 0) {
        expect(deliverIndex).toBeLessThan(orchestratorIndex);
      }
    }
  });

  it('should record audit log when delivery fails', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    try {
      await runTx2Imp2Agent(input, mockAiClient);
    } catch (error) {
      // Expected to throw
    }

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('should include failedDeliveryCount in output when delivery fails', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityData,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit
    };

    let resultOutput: any = null;
    let thrownError: any = null;

    try {
      resultOutput = await runTx2Imp2Agent(input, mockAiClient);
    } catch (error: any) {
      thrownError = error;
    }

    if (resultOutput && resultOutput.status === 'partial_success') {
      expect(
        resultOutput.failedDeliveryCount === null ||
        typeof resultOutput.failedDeliveryCount === 'number'
      ).toBe(true);
    } else if (thrownError) {
      expect(thrownError).toBeInstanceOf(WorkInstructionDeliveryFailedError);
    }
  });
});