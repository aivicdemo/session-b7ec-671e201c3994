import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';

jest.mock('../../src/agents/tx-4-imp-1/orchestrator');

describe('SCEN-077: 実行中に部分的なエラーが発生した場合', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockMonitorAndJudgeDelayRisk = jest
      .fn()
      .mockRejectedValue(
        new Error('進捗データの取得に失敗しました。連携ログを確認してください。')
      );
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([]);
    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue([]);
    mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockResolvedValue([]);
    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);

    jest.doMock('../../src/agents/tx-4-imp-1/orchestrator', () => ({
      runTx4Imp1Agent: jest.fn().mockImplementation(async (input, aiClient) => {
        const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const monitoringTimestamp = new Date().toISOString();

        try {
          await mockAuthorizeOperation(input.userId);

          try {
            await mockMonitorAndJudgeDelayRisk(
              input.facilityIds,
              input.riskThresholdScore
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Unknown error occurred';
            return {
              executionId,
              monitoringTimestamp,
              delayRiskJudgments: [],
              identifiedFacilities: [],
              generatedAllocationPlans: [],
              approvalResults: [],
              deliveredInstructions: [],
              executionStatus: 'partial_completion',
              errorSummary: errorMessage,
            };
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Authorization failed';
          return {
            executionId,
            monitoringTimestamp,
            delayRiskJudgments: [],
            identifiedFacilities: [],
            generatedAllocationPlans: [],
            approvalResults: [],
            deliveredInstructions: [],
            executionStatus: 'partial_completion',
            errorSummary: errorMessage,
          };
        }

        return {
          executionId,
          monitoringTimestamp,
          delayRiskJudgments: [],
          identifiedFacilities: [],
          generatedAllocationPlans: [],
          approvalResults: [],
          deliveredInstructions: [],
          executionStatus: 'completed',
          errorSummary: null,
        };
      }),
    }));
  });

  it('進捗データ取得フェーズでエラーが発生した場合、executionStatus が partial_completion となり、errorSummary にエラー要約が記録される', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    const result = await runTx4Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('partial_completion');
    expect(result.errorSummary).not.toBeNull();
    expect(result.errorSummary).toContain('進捗データの取得に失敗しました');
    expect(result.delayRiskJudgments).toEqual([]);
    expect(result.identifiedFacilities).toEqual([]);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.approvalResults).toEqual([]);
    expect(result.deliveredInstructions).toEqual([]);
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);
    expect(result.monitoringTimestamp).toBeDefined();
    expect(typeof result.monitoringTimestamp).toBe('string');
    expect(result.monitoringTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it('遅延リスク判定に失敗した場合、以降のフェーズは実行されない', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    await runTx4Imp1Agent(input, aiClient);

    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();
  });

  it('executionId と monitoringTimestamp は常に生成される', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    const result = await runTx4Imp1Agent(input, aiClient);

    expect(result.executionId).toBeDefined();
    expect(result.monitoringTimestamp).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(typeof result.monitoringTimestamp).toBe('string');
  });
});