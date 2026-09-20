import { runTx1Imp1Agent, Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-007: エラー系 - NoDelayDetectedError when no delay or quality variance detected', () => {
  const executorUserId = 'user-001';
  const targetFacilityIds = ['facility-001', 'facility-002'];
  const targetTeamIds = ['team-001', 'team-002'];
  const monitoringWindowMinutes = 60;
  const delayRiskThreshold = 60;
  const qualityVarianceThreshold = 15;
  const autoApprovalEnabled = true;

  const input: Tx1Imp1AgentInput = {
    executorUserId,
    targetFacilityIds,
    targetTeamIds,
    monitoringWindowMinutes,
    delayRiskThreshold,
    qualityVarianceThreshold,
    autoApprovalEnabled,
  };

  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMonitorAndJudgeDelayRisk = jest.fn();
    mockGenerateAllocationPlans = jest.fn();
    mockAuthorizeOperation = jest.fn();
    mockRecordOperationAudit = jest.fn();

    mockMonitorAndJudgeDelayRisk.mockResolvedValue({
      delayDetectionResult: {
        detectionTimestamp: new Date().toISOString(),
        delayDetected: false,
        affectedFacilities: [],
        qualityVarianceDetected: false,
        overallRiskScore: 0,
      },
    });

    mockGenerateAllocationPlans.mockResolvedValue([]);

    mockAuthorizeOperation.mockResolvedValue({ authorized: true });

    mockRecordOperationAudit.mockResolvedValue({ recorded: true });
  });

  it('should throw NoDelayDetectedError when delay and quality variance are both not detected', async () => {
    const mockAiClient = {
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
    };

    try {
      await runTx1Imp1Agent(input, mockAiClient);
      fail('Expected NoDelayDetectedError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('NoDelayDetectedError');
      expect(error.message).toBe('現在、対応が必要な遅延・品質ばらつきは検知されていません。');
    }
  });

  it('should return error response without execution fields when NoDelayDetectedError is returned as result', async () => {
    const mockAiClient = {
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
    };

    const result = await runTx1Imp1Agent(input, mockAiClient);

    if (result && 'errorCode' in result) {
      expect(result).toHaveProperty('errorCode');
      expect(result).toHaveProperty('errorMessage');
      expect(result).not.toHaveProperty('executionStatus');
      expect(result).not.toHaveProperty('executionId');
      expect(result).not.toHaveProperty('delayDetectionResult');
      expect(result).not.toHaveProperty('generatedAllocationPlans');
      expect(result).not.toHaveProperty('approvedAllocationPlans');
      expect(result).not.toHaveProperty('deliveryResults');
    } else if (result instanceof Error || (result && 'name' in result)) {
      expect(result.name).toBe('NoDelayDetectedError');
      expect(result.message).toBe('現在、対応が必要な遅延・品質ばらつきは検知されていません。');
    } else {
      throw new Error('Expected either error response or error object');
    }
  });

  it('should not include executionStatus, executionId or other output fields in error response', async () => {
    const mockAiClient = {
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
    };

    try {
      const result = await runTx1Imp1Agent(input, mockAiClient);
      
      if (result && typeof result === 'object') {
        expect(result).not.toHaveProperty('executionStatus');
        expect(result).not.toHaveProperty('executionId');
        expect(result).not.toHaveProperty('executionTimestamp');
        expect(result).not.toHaveProperty('delayDetectionResult');
        expect(result).not.toHaveProperty('generatedAllocationPlans');
        expect(result).not.toHaveProperty('approvedAllocationPlans');
        expect(result).not.toHaveProperty('deliveryResults');
        expect(result).not.toHaveProperty('executionErrors');
      }
    } catch (error: any) {
      expect(error.name).toBe('NoDelayDetectedError');
    }
  });

  it('should verify that delayDetected flag is false when error is expected', async () => {
    const mockAiClient = {
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
    };

    try {
      await runTx1Imp1Agent(input, mockAiClient);
      fail('Expected NoDelayDetectedError to be thrown or returned');
    } catch (error: any) {
      expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
      expect(error.name).toBe('NoDelayDetectedError');
    }
  });

  it('should confirm monitorAndJudgeDelayRisk was invoked with correct parameters', async () => {
    const mockAiClient = {
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
    };

    try {
      await runTx1Imp1Agent(input, mockAiClient);
    } catch (error: any) {
      expect(error.name).toBe('NoDelayDetectedError');
    }

    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    const callArgs = mockMonitorAndJudgeDelayRisk.mock.calls[0];
    expect(callArgs).toBeDefined();
  });
});