import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as orchestratorModule from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-068: Tx4Imp1Agent input validation', () => {
  it('should throw InvalidInputError when userId is empty string and not call subsequent operations', async () => {
    const invalidInput = {
      userId: '',
      facilityIds: ['facility-1'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const spyAuthorizeOperation = jest.spyOn(orchestratorModule, 'authorizeOperation' as any).mockImplementation(() => {});
    const spyMonitorAndJudgeDelayRisk = jest.spyOn(orchestratorModule, 'monitorAndJudgeDelayRisk' as any).mockImplementation(() => {});
    const spyGenerateAllocationPlans = jest.spyOn(orchestratorModule, 'generateAllocationPlans' as any).mockImplementation(() => {});
    const spyJudgeAllocationPlanApproval = jest.spyOn(orchestratorModule, 'judgeAllocationPlanApprovalWithCriteria' as any).mockImplementation(() => {});
    const spyDeliverAllocationPlan = jest.spyOn(orchestratorModule, 'deliverAllocationPlanAndWorkInstructions' as any).mockImplementation(() => {});
    const spyRecordOperationAudit = jest.spyOn(orchestratorModule, 'recordOperationAudit' as any).mockImplementation(() => {});

    let thrownError: Error | null = null;

    try {
      await runTx4Imp1Agent(invalidInput, {} as any);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.name).toBe('InvalidInputError');
    expect(thrownError?.message).toBe('入力パラメータが不正です。');
    
    expect(spyAuthorizeOperation).not.toHaveBeenCalled();
    expect(spyMonitorAndJudgeDelayRisk).not.toHaveBeenCalled();
    expect(spyGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(spyJudgeAllocationPlanApproval).not.toHaveBeenCalled();
    expect(spyDeliverAllocationPlan).not.toHaveBeenCalled();
    expect(spyRecordOperationAudit).not.toHaveBeenCalled();

    spyAuthorizeOperation.mockRestore();
    spyMonitorAndJudgeDelayRisk.mockRestore();
    spyGenerateAllocationPlans.mockRestore();
    spyJudgeAllocationPlanApproval.mockRestore();
    spyDeliverAllocationPlan.mockRestore();
    spyRecordOperationAudit.mockRestore();
  });

  it('should throw InvalidInputError when required userId field is missing', async () => {
    const invalidInput = {
      userId: '',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const spyAuthorizeOperation = jest.spyOn(orchestratorModule, 'authorizeOperation' as any).mockImplementation(() => {});
    const spyMonitorAndJudgeDelayRisk = jest.spyOn(orchestratorModule, 'monitorAndJudgeDelayRisk' as any).mockImplementation(() => {});
    const spyGenerateAllocationPlans = jest.spyOn(orchestratorModule, 'generateAllocationPlans' as any).mockImplementation(() => {});
    const spyJudgeAllocationPlanApproval = jest.spyOn(orchestratorModule, 'judgeAllocationPlanApprovalWithCriteria' as any).mockImplementation(() => {});
    const spyDeliverAllocationPlan = jest.spyOn(orchestratorModule, 'deliverAllocationPlanAndWorkInstructions' as any).mockImplementation(() => {});
    const spyRecordOperationAudit = jest.spyOn(orchestratorModule, 'recordOperationAudit' as any).mockImplementation(() => {});

    let thrownError: Error | null = null;

    try {
      await runTx4Imp1Agent(invalidInput, {} as any);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.name).toBe('InvalidInputError');
    expect(thrownError?.message).toBe('入力パラメータが不正です。');
    
    expect(spyAuthorizeOperation).not.toHaveBeenCalled();
    expect(spyMonitorAndJudgeDelayRisk).not.toHaveBeenCalled();
    expect(spyGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(spyJudgeAllocationPlanApproval).not.toHaveBeenCalled();
    expect(spyDeliverAllocationPlan).not.toHaveBeenCalled();
    expect(spyRecordOperationAudit).not.toHaveBeenCalled();

    spyAuthorizeOperation.mockRestore();
    spyMonitorAndJudgeDelayRisk.mockRestore();
    spyGenerateAllocationPlans.mockRestore();
    spyJudgeAllocationPlanApproval.mockRestore();
    spyDeliverAllocationPlan.mockRestore();
    spyRecordOperationAudit.mockRestore();
  });
});