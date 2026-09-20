import { deliverImprovementInstructionToFacility } from '../../src/logic/notification-external-integration';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as authAuthorization from '../../src/logic/auth-authorization-audit';
import * as notificationExternal from '../../src/logic/notification-external-integration';

// Mock dependencies
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/auth-authorization-audit');
jest.mock('../../src/logic/notification-external-integration', () => ({
  ...jest.requireActual('../../src/logic/notification-external-integration'),
  recordWorkInstructionDeliveryHistory: jest.fn(),
}));

describe('SCEN-1183: deliverImprovementInstructionToFacility - FacilityNotFound error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw FacilityNotFound error when specified facility ID does not exist', async () => {
    // Arrange: Setup test input values
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'facility-nonexistent',
      teamId: null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: 'Add 5 personnel',
          targetWorkInstructionIds: [],
          recommendedActionDetails: 'Add 5 personnel to meet deadline',
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const,
      priority: 'high' as const,
      requestedByUserId: 'user-123',
      requestedAt: new Date(),
    };

    // Setup precondition: Mock getDelayRiskJudgmentById to return valid risk judgment result
    const mockRiskJudgment = {
      リスク判定結果ID: 'risk-001',
      作業指示ID: 'work-001',
      拠点ID: 'facility-nonexistent',
      チームID: 'team-001',
      判定日時: new Date(),
      リスクレベル: '高',
      進捗率: 50,
      計画進捗率: 80,
    };
    (dataPersistence.getDelayRiskJudgmentById as jest.Mock).mockResolvedValue(
      mockRiskJudgment
    );

    // Setup precondition: Mock getFacilityById to return null for nonexistent facility
    (dataPersistence.getFacilityById as jest.Mock).mockImplementation(
      (facilityId: string) => {
        if (facilityId === 'facility-nonexistent') {
          return Promise.resolve(null);
        }
        return Promise.resolve({});
      }
    );

    // Setup precondition: Mock getTeamById (will not be called)
    (dataPersistence.getTeamById as jest.Mock).mockResolvedValue(null);

    // Setup precondition: Mock authorizeOperation to grant permission
    (authAuthorization.authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    // Act & Assert: Call the target function and verify it throws FacilityNotFound error
    let caughtError: any = null;
    let result: any = null;

    try {
      result = await deliverImprovementInstructionToFacility(input);
    } catch (error: any) {
      caughtError = error;
    }

    // Verify error was thrown and is of correct type
    expect(caughtError).not.toBeNull();
    expect(caughtError.name).toBe('FacilityNotFound');
    expect(caughtError.message).toBe('対象拠点が見つかりません。');

    // Verify output is not returned (should not reach return statement)
    expect(result).toBeUndefined();

    // Verify that DeliverImprovementInstructionToFacilityOutput is not returned
    expect(result).not.toBeDefined();
    expect(caughtError).not.toHaveProperty('success');
    expect(caughtError).not.toHaveProperty('deliveredChannels');
    expect(caughtError).not.toHaveProperty('fieldLeaderDeliveryStatus');
    expect(caughtError).not.toHaveProperty('deliveryHistoryIds');

    // Verify getDelayRiskJudgmentById was called (risk judgment confirmation was executed)
    expect(dataPersistence.getDelayRiskJudgmentById).toHaveBeenCalledWith(
      'risk-001'
    );

    // Verify authorizeOperation was called (authorization check was executed)
    expect(authAuthorization.authorizeOperation).toHaveBeenCalled();

    // Verify getFacilityById was called with correct facility ID
    expect(dataPersistence.getFacilityById).toHaveBeenCalledWith(
      'facility-nonexistent'
    );

    // Verify getTeamById was NOT called (should fail before team check)
    expect(dataPersistence.getTeamById).not.toHaveBeenCalled();

    // Verify recordWorkInstructionDeliveryHistory was NOT called
    expect(notificationExternal.recordWorkInstructionDeliveryHistory).not.toHaveBeenCalled();
  });
});