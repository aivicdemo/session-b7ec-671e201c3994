import { jest } from '@jest/globals';
import { deliverImprovementInstructionToFacility } from '../../src/logic/notification-external-integration';

// Mock the dependencies
jest.mock('../../src/logic/authorization', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/logic/delay-risk-judgment', () => ({
  getDelayRiskJudgmentById: jest.fn(),
}));

jest.mock('../../src/logic/facility', () => ({
  getFacilityById: jest.fn(),
}));

jest.mock('../../src/logic/delivery-history', () => ({
  recordWorkInstructionDeliveryHistory: jest.fn(),
}));

jest.mock('../../src/logic/notification-adapter', () => ({
  NotificationServiceAdapter: {
    sendDelayRiskAlert: jest.fn(),
  },
}));

import { authorizeOperation } from '../../src/logic/authorization';
import { getDelayRiskJudgmentById } from '../../src/logic/delay-risk-judgment';
import { getFacilityById } from '../../src/logic/facility';
import { recordWorkInstructionDeliveryHistory } from '../../src/logic/delivery-history';
import { NotificationServiceAdapter } from '../../src/logic/notification-adapter';

describe('SCEN-1187: 配信履歴のログ記録に失敗した場合、SyncLogRecordingFailureエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks for successful operations
    (authorizeOperation as jest.Mock).mockResolvedValue({ authorized: true });

    (getDelayRiskJudgmentById as jest.Mock).mockResolvedValue({
      id: 'risk-001',
      workInstructionId: 'work-001',
      riskLevel: 'high',
      delayDays: 2,
    });

    (getFacilityById as jest.Mock).mockResolvedValue({
      id: 'fac-001',
      name: 'Facility 001',
      status: 'active',
    });
  });

  it('配信履歴記録に失敗した場合、SyncLogRecordingFailureエラーが発生する', async () => {
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: '追加2名',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-001',
      requestedAt: new Date(),
    };

    // Setup notification to succeed
    (NotificationServiceAdapter.sendDelayRiskAlert as jest.Mock).mockResolvedValue({
      deliveryId: 'del-001',
      timestamp: new Date(),
    });

    // Setup recordWorkInstructionDeliveryHistory to fail
    (recordWorkInstructionDeliveryHistory as jest.Mock).mockRejectedValue(
      new Error('データベース接続失敗')
    );

    let caughtError: Error | undefined;
    try {
      await deliverImprovementInstructionToFacility(input);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.name).toBe('SyncLogRecordingFailure');
    expect(caughtError?.message).toBe('配信履歴の記録に失敗しました。');
  });

  it('配信が成功した後にログ記録が失敗した場合、エラーが優先される', async () => {
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: '追加2名',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-001',
      requestedAt: new Date(),
    };

    // Setup notification to succeed - delivery actually happened
    (NotificationServiceAdapter.sendDelayRiskAlert as jest.Mock).mockResolvedValue({
      deliveryId: 'del-001',
      channelsDelivered: ['email', 'app_notification'],
      timestamp: new Date(),
    });

    // Setup recordWorkInstructionDeliveryHistory to fail AFTER delivery
    (recordWorkInstructionDeliveryHistory as jest.Mock).mockRejectedValue(
      new Error('データベース接続失敗')
    );

    let caughtError: Error | undefined;
    try {
      await deliverImprovementInstructionToFacility(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify delivery adapter was called (delivery was successful)
    expect(NotificationServiceAdapter.sendDelayRiskAlert).toHaveBeenCalled();

    // Verify log recording was called
    expect(recordWorkInstructionDeliveryHistory).toHaveBeenCalled();

    // Verify error is thrown despite successful delivery
    expect(caughtError).toBeDefined();
    expect(caughtError?.name).toBe('SyncLogRecordingFailure');
    expect(caughtError?.message).toBe('配信履歴の記録に失敗しました。');
  });

  it('ログ記録失敗時、出力型DeliverImprovementInstructionToFacilityOutputは返されない', async () => {
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: '追加2名',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-001',
      requestedAt: new Date(),
    };

    (NotificationServiceAdapter.sendDelayRiskAlert as jest.Mock).mockResolvedValue({
      deliveryId: 'del-001',
      timestamp: new Date(),
    });

    (recordWorkInstructionDeliveryHistory as jest.Mock).mockRejectedValue(
      new Error('データベース接続失敗')
    );

    let thrownError: Error | undefined;
    let didThrowError = false;

    try {
      await deliverImprovementInstructionToFacility(input);
    } catch (error) {
      didThrowError = true;
      thrownError = error as Error;
    }

    expect(didThrowError).toBe(true);
    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('SyncLogRecordingFailure');
    expect(thrownError?.message).toBe('配信履歴の記録に失敗しました。');
  });

  it('authorizeOperationが権限チェックで呼び出されることを確認', async () => {
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: '追加2名',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-001',
      requestedAt: new Date(),
    };

    (NotificationServiceAdapter.sendDelayRiskAlert as jest.Mock).mockResolvedValue({
      deliveryId: 'del-001',
      timestamp: new Date(),
    });

    (recordWorkInstructionDeliveryHistory as jest.Mock).mockRejectedValue(
      new Error('データベース接続失敗')
    );

    try {
      await deliverImprovementInstructionToFacility(input);
    } catch {
      // Error is expected
    }

    expect(authorizeOperation).toHaveBeenCalledWith(
      'user-001',
      expect.any(String)
    );
  });

  it('getDelayRiskJudgmentByIdが呼び出されることを確認', async () => {
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: '追加2名',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-001',
      requestedAt: new Date(),
    };

    (NotificationServiceAdapter.sendDelayRiskAlert as jest.Mock).mockResolvedValue({
      deliveryId: 'del-001',
      timestamp: new Date(),
    });

    (recordWorkInstructionDeliveryHistory as jest.Mock).mockRejectedValue(
      new Error('データベース接続失敗')
    );

    try {
      await deliverImprovementInstructionToFacility(input);
    } catch {
      // Error is expected
    }

    expect(getDelayRiskJudgmentById).toHaveBeenCalledWith('risk-001');
  });

  it('getFacilityByIdが呼び出されることを確認', async () => {
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: '追加2名',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-001',
      requestedAt: new Date(),
    };

    (NotificationServiceAdapter.sendDelayRiskAlert as jest.Mock).mockResolvedValue({
      deliveryId: 'del-001',
      timestamp: new Date(),
    });

    (recordWorkInstructionDeliveryHistory as jest.Mock).mockRejectedValue(
      new Error('データベース接続失敗')
    );

    try {
      await deliverImprovementInstructionToFacility(input);
    } catch {
      // Error is expected
    }

    expect(getFacilityById).toHaveBeenCalledWith('fac-001');
  });

  it('recordWorkInstructionDeliveryHistoryが呼び出されたことを確認', async () => {
    const input = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: '追加2名',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-001',
      requestedAt: new Date(),
    };

    (NotificationServiceAdapter.sendDelayRiskAlert as jest.Mock).mockResolvedValue({
      deliveryId: 'del-001',
      timestamp: new Date(),
    });

    (recordWorkInstructionDeliveryHistory as jest.Mock).mockRejectedValue(
      new Error('データベース接続失敗')
    );

    let errorWasThrown = false;
    try {
      await deliverImprovementInstructionToFacility(input);
    } catch (error) {
      errorWasThrown = true;
      expect((error as Error).name).toBe('SyncLogRecordingFailure');
    }

    expect(errorWasThrown).toBe(true);
    expect(recordWorkInstructionDeliveryHistory).toHaveBeenCalled();
  });
});