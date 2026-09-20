import { findPlacementPlanByWorkerAndDate } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/authorization-and-validation');

class UnauthorizedAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedAccessError';
  }
}

describe('SCEN-503: findPlacementPlanByWorkerAndDate - Unauthorized access error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccess error when requestingUserId lacks access permission', () => {
    const mockAuthorizeUserAction = authModule.authorizeUserAction as jest.MockedFunction<typeof authModule.authorizeUserAction>;
    const mockValidateInputData = authModule.validateInputData as jest.MockedFunction<typeof authModule.validateInputData>;

    const input = {
      workerId: 'W001',
      targetDate: new Date('2024-01-15'),
      requestingUserId: 'U999',
    };

    mockAuthorizeUserAction.mockImplementation(() => {
      throw new UnauthorizedAccessError('この操作を実行する権限がありません。');
    });
    
    mockValidateInputData.mockReturnValue(true);

    let errorThrown: Error | null = null;

    try {
      findPlacementPlanByWorkerAndDate(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown).toBeInstanceOf(UnauthorizedAccessError);
    expect(errorThrown?.name).toBe('UnauthorizedAccessError');
    expect(errorThrown?.message).toBe('この操作を実行する権限がありません。');
    expect(mockAuthorizeUserAction).toHaveBeenCalled();
    expect(mockValidateInputData).toHaveBeenCalled();
  });
});