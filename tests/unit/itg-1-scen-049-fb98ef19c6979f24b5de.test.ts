import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as authModule from '../../src/agents/tx-3-imp-1/authorization';
import * as auditModule from '../../src/agents/tx-3-imp-1/audit';

jest.mock('../../src/agents/tx-3-imp-1/authorization');
jest.mock('../../src/agents/tx-3-imp-1/audit');

describe('SCEN-049: エラー系：呼び出し元ユーザーが権限を持たずに権限拒否エラーが発生する', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockRejectedValue({
      name: 'AuthorizationDenied',
      message: 'この操作を実行する権限がありません。',
      code: 'AUTHORIZATION_DENIED',
    });

    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);

    (authModule.authorizeOperation as jest.Mock) = mockAuthorizeOperation;
    (auditModule.recordOperationAudit as jest.Mock) = mockRecordOperationAudit;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('権限がないユーザーでエージェント実行すると、AuthorizationDenied エラーが発生する', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const aiClient = {
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
    };

    const result = await runTx3Imp1Agent(input, aiClient as any);

    expect(result.executionStatus).toBe('failure');

    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBe(0);

    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBe(0);

    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBe(0);

    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails.length).toBeGreaterThan(0);

    const authError = result.errorDetails.find(err => err.errorCode === 'AUTHORIZATION_DENIED');
    expect(authError).toBeDefined();
    expect(authError?.errorMessage).toBe('この操作を実行する権限がありません。');
    expect(authError?.errorTimestamp).toBeDefined();
    expect(typeof authError?.errorTimestamp).toBe('string');
    expect(authError?.errorTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('authorizeOperation が呼び出されることを確認する', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const result = await runTx3Imp1Agent(input, {
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
    } as any);

    expect(mockAuthorizeOperation).toHaveBeenCalled();
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'unauthorized_user',
      })
    );

    expect(result.executionStatus).toBe('failure');
  });

  it('authorizeOperation が権限拒否を返すと、後続処理が呼び出されない', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const mockMonitorAndJudgeDelayRisk = jest.fn();
    const mockGenerateAllocationPlans = jest.fn();
    const mockJudgeAllocationPlanApprovalWithCriteria = jest.fn();
    const mockDeliverAllocationPlanAndWorkInstructions = jest.fn();

    const result = await runTx3Imp1Agent(input, {
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    } as any);

    expect(mockMonitorAndJudgeDelayRisk).not.toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

    expect(result.executionStatus).toBe('failure');
  });

  it('監査ログに操作失敗が記録される', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const result = await runTx3Imp1Agent(input, {
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
    } as any);

    expect(mockRecordOperationAudit).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'unauthorized_user',
        operationStatus: 'failure',
      })
    );

    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails.length).toBeGreaterThan(0);

    const authError = result.errorDetails.find(err => err.errorCode === 'AUTHORIZATION_DENIED');
    expect(authError).toBeDefined();
    expect(authError?.errorMessage).toBe('この操作を実行する権限がありません。');
  });

  it('authorizeOperation が権限拒否エラーを返すよう設定したスタブが動作することを確認する', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const result = await runTx3Imp1Agent(input, {
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
    } as any);

    const authError = result.errorDetails.find(err => err.errorCode === 'AUTHORIZATION_DENIED');
    expect(authError).toBeDefined();
    expect(authError?.errorCode).toBe('AUTHORIZATION_DENIED');
    expect(authError?.errorMessage).toBe('この操作を実行する権限がありません。');

    expect(result.executionStatus).toBe('failure');
  });

  it('delayRiskJudgmentResults、generatedAllocationPlans、deliveryResults が空配列であることを確認', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const result = await runTx3Imp1Agent(input, {
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
    } as any);

    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBe(0);

    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBe(0);

    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBe(0);
  });

  it('errorDetails が ErrorDetail[] 型として正しく構造化されていることを確認', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const result = await runTx3Imp1Agent(input, {
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
    } as any);

    expect(Array.isArray(result.errorDetails)).toBe(true);

    const authError = result.errorDetails[0];
    expect(authError).toBeDefined();
    expect(typeof authError.errorCode).toBe('string');
    expect(typeof authError.errorMessage).toBe('string');
    expect(typeof authError.errorTimestamp).toBe('string');

    expect(authError.errorCode).toBe('AUTHORIZATION_DENIED');
    expect(authError.errorMessage).toBe('この操作を実行する権限がありません。');

    const isValidISO8601 = !isNaN(Date.parse(authError.errorTimestamp));
    expect(isValidISO8601).toBe(true);
  });

  it('権限拒否後、recordOperationAudit が呼び出され、操作は中断される', async () => {
    const input = {
      userId: 'unauthorized_user',
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      riskThresholdScore: 70,
      approverUserId: 'approver_user',
      executionContext: 'manual_trigger',
    };

    const mockMonitorAndJudgeDelayRisk = jest.fn();
    const mockGenerateAllocationPlans = jest.fn();
    const mockJudgeAllocationPlanApprovalWithCriteria = jest.fn();
    const mockDeliverAllocationPlanAndWorkInstructions = jest.fn();

    const result = await runTx3Imp1Agent(input, {
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    } as any);

    expect(mockRecordOperationAudit).toHaveBeenCalled();

    const auditCall = mockRecordOperationAudit.mock.calls[0][0];
    expect(auditCall).toMatchObject({
      userId: 'unauthorized_user',
      operationStatus: 'failure',
    });

    expect(mockMonitorAndJudgeDelayRisk).not.toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

    expect(result.executionStatus).toBe('failure');
    expect(result.delayRiskJudgmentResults).toEqual([]);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.deliveryResults).toEqual([]);
  });
});