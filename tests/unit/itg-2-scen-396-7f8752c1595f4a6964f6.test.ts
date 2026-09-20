import { executePlacementChangeWithApproval } from '../../src/logic/placement-change-execution';
import * as authModule from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-396: executePlacementChangeWithApproval - Unauthorized Approver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when approver lacks authorization', async () => {
    const input = {
      placementProposalId: 'PROP-001',
      approverUserId: 'USER-999',
      executorUserId: 'USER-100',
      approvalReason: '最適化提案',
      executionNotes: '',
      requestTimestamp: '2025-01-15T10:30:00Z',
    };

    const unauthorizedError = new Error('この配置案を承認する権限がありません。');
    (unauthorizedError as any).code = 'UnauthorizedApprovalAction';

    (authModule.authorizeUserAction as jest.Mock).mockImplementationOnce(() => {
      throw unauthorizedError;
    });

    const result = await executePlacementChangeWithApproval(input);

    expect(result.success).toBe(false);
    expect(result.allocationChangeHistoryId).toBeNull();
    expect(result.newPlacementPlanId).toBeNull();
    expect(result.placementChangeDetails).toBeNull();
    expect(result.errorMessage).toBe('この配置案を承認する権限がありません。');
    expect(result.notificationStatus.delivered).toBe(false);
    expect(result.executionTimestamp).toBeDefined();

    expect(authModule.authorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'USER-999',
      })
    );
  });
});