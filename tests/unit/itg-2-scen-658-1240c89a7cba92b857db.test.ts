import { findAllocationChangeHistoryByPeriod } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-658: findAllocationChangeHistoryByPeriod - Authorization Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccessError when requesting user lacks search permission', async () => {
    const mockAuthorizeUserAction = authModule.authorizeUserAction as jest.MockedFunction<typeof authModule.authorizeUserAction>;
    const mockValidateInputData = authModule.validateInputData as jest.MockedFunction<typeof authModule.validateInputData>;

    mockAuthorizeUserAction.mockReturnValue({
      authorized: false,
      reason: 'この操作を実行する権限がありません。',
    });

    mockValidateInputData.mockReturnValue({
      valid: true,
    });

    const input = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      statusFilter: undefined,
      requestingUserId: 'user-without-permission',
    };

    await expect(findAllocationChangeHistoryByPeriod(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'UnauthorizedAccessError',
        message: 'この操作を実行する権限がありません。',
      })
    );

    expect(mockAuthorizeUserAction).toHaveBeenCalledWith('user-without-permission', expect.any(String));
    expect(mockValidateInputData).toHaveBeenCalled();
  });
});