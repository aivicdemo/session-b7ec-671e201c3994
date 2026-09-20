import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-094: 複数チームの進捗データ取得がタイムアウトまたはエラーで失敗したため、ProgressDataRetrievalFailureエラーで中断する', () => {
  let mockListProgressData: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApproval: jest.Mock;
  let mockDeliverAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    mockListProgressData = jest.fn();
    mockAuthorizeOperation = jest.fn();
    mockGenerateAllocationPlans = jest.fn();
    mockJudgeAllocationPlanApproval = jest.fn();
    mockDeliverAllocationPlan = jest.fn();
    mockRecordOperationAudit = jest.fn();

    jest.clearAllMocks();
  });

  it('進捗データ取得がタイムアウトエラーで失敗した場合、ProgressDataRetrievalFailureエラーをスローする', async () => {
    const userId = 'user-001';
    const orderSurgeEvent = {
      eventId: 'evt-001',
      facilityId: 'FAC-001',
      detectionTimestamp: new Date().toISOString(),
      surgeQuantity: 500,
      surgePercentage: 150,
    };
    const targetFacilityIds = ['FAC-001', 'FAC-002', 'FAC-003'];
    const analysisTimeWindowMinutes = 60;
    const autoApprovalThreshold = 80;

    mockAuthorizeOperation.mockResolvedValue({
      authorized: true,
      userId,
      timestamp: new Date().toISOString(),
    });

    mockListProgressData.mockRejectedValue(
      new Error('Request timeout after 30000ms')
    );

    mockRecordOperationAudit.mockResolvedValue({
      auditId: 'audit-001',
      userId,
      operationType: 'runTx6Imp1Agent',
      status: 'failure',
      errorReason: 'ProgressDataRetrievalFailure',
      timestamp: new Date().toISOString(),
    });

    const aiClient = {
      listProgressDataByCondition: mockListProgressData,
      authorizeOperation: mockAuthorizeOperation,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit,
    };

    await expect(
      runTx6Imp1Agent(
        {
          userId,
          orderSurgeEvent,
          targetFacilityIds,
          analysisTimeWindowMinutes,
          autoApprovalThreshold,
        },
        aiClient
      )
    ).rejects.toMatchObject({
      name: 'ProgressDataRetrievalFailure',
      message: '進捗データの取得に失敗しました。WMS連携ログを確認してください。',
    });
  });

  it('進捗データ取得呼び出し以降の処理が実行されていないことを確認', async () => {
    const userId = 'user-001';
    const orderSurgeEvent = {
      eventId: 'evt-001',
      facilityId: 'FAC-001',
      detectionTimestamp: new Date().toISOString(),
      surgeQuantity: 500,
      surgePercentage: 150,
    };
    const targetFacilityIds = ['FAC-001', 'FAC-002', 'FAC-003'];

    mockAuthorizeOperation.mockResolvedValue({
      authorized: true,
      userId,
      timestamp: new Date().toISOString(),
    });

    mockListProgressData.mockRejectedValue(
      new Error('Connection refused')
    );

    mockRecordOperationAudit.mockResolvedValue({
      auditId: 'audit-001',
      userId,
      operationType: 'runTx6Imp1Agent',
      status: 'failure',
      errorReason: 'ProgressDataRetrievalFailure',
      timestamp: new Date().toISOString(),
    });

    const aiClient = {
      listProgressDataByCondition: mockListProgressData,
      authorizeOperation: mockAuthorizeOperation,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit,
    };

    try {
      await runTx6Imp1Agent(
        {
          userId,
          orderSurgeEvent,
          targetFacilityIds,
          analysisTimeWindowMinutes: 60,
          autoApprovalThreshold: 80,
        },
        aiClient
      );
    } catch (error) {
      // エラーが発生することを期待
    }

    expect(mockListProgressData).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApproval).not.toHaveBeenCalled();
    expect(mockDeliverAllocationPlan).not.toHaveBeenCalled();
  });

  it('失敗を監査ログに記録する', async () => {
    const userId = 'user-001';
    const orderSurgeEvent = {
      eventId: 'evt-001',
      facilityId: 'FAC-001',
      detectionTimestamp: new Date().toISOString(),
      surgeQuantity: 500,
      surgePercentage: 150,
    };
    const targetFacilityIds = ['FAC-001', 'FAC-002', 'FAC-003'];

    mockAuthorizeOperation.mockResolvedValue({
      authorized: true,
      userId,
      timestamp: new Date().toISOString(),
    });

    mockListProgressData.mockRejectedValue(
      new Error('Service unavailable')
    );

    mockRecordOperationAudit.mockResolvedValue({
      auditId: 'audit-001',
      userId,
      operationType: 'runTx6Imp1Agent',
      status: 'failure',
      errorReason: 'ProgressDataRetrievalFailure',
      timestamp: new Date().toISOString(),
    });

    const aiClient = {
      listProgressDataByCondition: mockListProgressData,
      authorizeOperation: mockAuthorizeOperation,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApproval,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit,
    };

    try {
      await runTx6Imp1Agent(
        {
          userId,
          orderSurgeEvent,
          targetFacilityIds,
          analysisTimeWindowMinutes: 60,
          autoApprovalThreshold: 80,
        },
        aiClient
      );
    } catch (error) {
      // エラーが発生することを期待
    }

    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        operationType: 'runTx6Imp1Agent',
        status: 'failure',
        errorReason: 'ProgressDataRetrievalFailure',
      })
    );
  });
});