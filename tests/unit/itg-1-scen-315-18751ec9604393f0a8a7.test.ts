import { judgeAllocationPlanApprovalWithCriteria } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-315: ユーザーが物流センター長権限を持たないとき、UserAuthorizationErrorが発生する', () => {
  let authorizeOperationStub: jest.Mock;
  let getAllocationPlanByIdStub: jest.Mock;
  let getRecentProgressDataByWorkInstructionStub: jest.Mock;
  let getLatestProductivityDataByWorkerStub: jest.Mock;
  let getRecentDelayRiskJudgmentByFacilityAndTeamStub: jest.Mock;
  let validateReferentialIntegrityStub: jest.Mock;
  let saveAllocationPlanStub: jest.Mock;
  let recordOperationAuditStub: jest.Mock;

  beforeEach(() => {
    authorizeOperationStub = jest.fn();
    getAllocationPlanByIdStub = jest.fn();
    getRecentProgressDataByWorkInstructionStub = jest.fn();
    getLatestProductivityDataByWorkerStub = jest.fn();
    getRecentDelayRiskJudgmentByFacilityAndTeamStub = jest.fn();
    validateReferentialIntegrityStub = jest.fn();
    saveAllocationPlanStub = jest.fn();
    recordOperationAuditStub = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserAuthorizationError when user does not have center manager role', async () => {
    const userAuthError = new Error('この操作を実行する権限がありません。');
    userAuthError.name = 'UserAuthorizationError';

    authorizeOperationStub.mockRejectedValueOnce(userAuthError);

    const input = {
      userId: 'user-without-center-manager-role',
      allocationPlanId: 'plan-12345',
      manualDecision: null as const,
      manualDecisionReason: null,
    };

    const dependencies = {
      authorizeOperation: authorizeOperationStub,
      getAllocationPlanById: getAllocationPlanByIdStub,
      getRecentProgressDataByWorkInstruction: getRecentProgressDataByWorkInstructionStub,
      getLatestProductivityDataByWorker: getLatestProductivityDataByWorkerStub,
      getRecentDelayRiskJudgmentByFacilityAndTeam: getRecentDelayRiskJudgmentByFacilityAndTeamStub,
      validateReferentialIntegrity: validateReferentialIntegrityStub,
      saveAllocationPlan: saveAllocationPlanStub,
      recordOperationAudit: recordOperationAuditStub,
    };

    await expect(judgeAllocationPlanApprovalWithCriteria(input, dependencies)).rejects.toMatchObject({
      name: 'UserAuthorizationError',
      message: 'この操作を実行する権限がありません。',
    });

    expect(authorizeOperationStub).toHaveBeenCalledWith(
      'user-without-center-manager-role',
      'approve_allocation_plan'
    );
    expect(authorizeOperationStub).toHaveBeenCalledTimes(1);

    expect(getAllocationPlanByIdStub).not.toHaveBeenCalled();
    expect(getRecentProgressDataByWorkInstructionStub).not.toHaveBeenCalled();
    expect(getLatestProductivityDataByWorkerStub).not.toHaveBeenCalled();
    expect(getRecentDelayRiskJudgmentByFacilityAndTeamStub).not.toHaveBeenCalled();
    expect(validateReferentialIntegrityStub).not.toHaveBeenCalled();
    expect(saveAllocationPlanStub).not.toHaveBeenCalled();
    expect(recordOperationAuditStub).not.toHaveBeenCalled();
  });
});