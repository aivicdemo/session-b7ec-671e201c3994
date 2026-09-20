import { executePlacementChangeWithApproval, ExecutePlacementChangeWithApprovalInput, ExecutePlacementChangeWithApprovalOutput } from '../../src/logic/placement-change-execution';
import * as authorizationModule from '../../src/logic/authorization-and-validation';

describe('SCEN-395: executePlacementChangeWithApproval - Nonexistent Placement Proposal', () => {
  let validateInputDataSpy: jest.SpyInstance;
  let authorizeUserActionSpy: jest.SpyInstance;

  beforeEach(() => {
    validateInputDataSpy = jest.spyOn(authorizationModule, 'validateInputData');
    authorizeUserActionSpy = jest.spyOn(authorizationModule, 'authorizeUserAction');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return error when placementProposalId does not exist', async () => {
    // Arrange: Prepare test input data with nonexistent placement proposal ID
    const input: ExecutePlacementChangeWithApprovalInput = {
      placementProposalId: 'nonexistent-proposal-999',
      approverUserId: 'approver-user-001',
      executorUserId: 'executor-user-001',
      requestTimestamp: new Date().toISOString(),
      approvalReason: 'Test approval',
      executionNotes: 'Test execution notes'
    };

    // Set up stub for validateInputData to return valid format
    validateInputDataSpy.mockResolvedValue({
      isValid: true,
      errors: []
    });

    // Set up stub for authorizeUserAction to return user has authority
    authorizeUserActionSpy.mockResolvedValue({
      authorized: true,
      userId: input.approverUserId
    });

    // Act: Call the target operation
    const result: ExecutePlacementChangeWithApprovalOutput = await executePlacementChangeWithApproval(input);

    // Assert: Verify output type fields
    expect(result.success).toBe(false);
    expect(result.allocationChangeHistoryId).toBeNull();
    expect(result.newPlacementPlanId).toBeNull();
    expect(result.placementChangeDetails).toBeNull();
    expect(result.errorMessage).toBe('配置案が見つかりません。提案IDを確認してください。');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.notificationStatus).toBeDefined();
    expect(result.notificationStatus.delivered).toBe(false);
  });
});