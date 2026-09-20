import {
  notifyPlacementProposalRejection,
  NotifyPlacementProposalRejectionOutput,
} from '../../src/logic/notification-and-integration';

// Mock the repository and service dependencies
jest.mock('../../src/data-access/placement-plan-repository');
jest.mock('../../src/data-access/allocation-change-history-repository');
jest.mock('../../src/data-access/user-repository');
jest.mock('../../src/logic/notification-and-integration', () => ({
  ...jest.requireActual('../../src/logic/notification-and-integration'),
  sendNotificationToAdministrator: jest.fn(),
  sendPlacementChangeAuditLog: jest.fn(),
}));

import { findPlacementPlanByWorkerAndDate } from '../../src/data-access/placement-plan-repository';
import { updateAllocationChangeHistoryStatus } from '../../src/data-access/allocation-change-history-repository';
import { findUsersByRole } from '../../src/data-access/user-repository';
import {
  sendNotificationToAdministrator,
  sendPlacementChangeAuditLog,
} from '../../src/logic/notification-and-integration';

describe('notifyPlacementProposalRejection - ProposalAlreadyProcessed Error', () => {
  const input = {
    proposalId: 'PROP-001',
    rejectionReason: 'BUSINESS_CONSTRAINT' as const,
    nextActionInstruction: '別案の再提案を検討',
    affectedWorkerIds: ['W001', 'W002'],
    notifyFieldLeaders: true,
    notifyAdministrators: true,
    deliveryChannels: ['EMAIL' as const, 'APP_NOTIFICATION' as const],
    requestedBy: 'USR-ADMIN-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw ProposalAlreadyProcessed error when proposal status is APPROVED', async () => {
    const mockPlacementPlan = {
      id: 'PLAN-001',
      proposalId: 'PROP-001',
      status: 'APPROVED',
      affectedWorkerIds: ['W001', 'W002'],
      createdAt: new Date().toISOString(),
    };

    (findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue(
      mockPlacementPlan
    );

    let caughtError: any = null;

    try {
      await notifyPlacementProposalRejection(input);
      fail('Expected notifyPlacementProposalRejection to throw an error');
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.name || caughtError.constructor.name).toBe(
      'ProposalAlreadyProcessed'
    );
    expect(caughtError.message).toMatch(
      /この配置案は既に処理済みです。状態: APPROVED/
    );
  });

  test('should throw ProposalAlreadyProcessed error when proposal status is EXECUTED', async () => {
    const mockPlacementPlan = {
      id: 'PLAN-002',
      proposalId: 'PROP-001',
      status: 'EXECUTED',
      affectedWorkerIds: ['W001', 'W002'],
      createdAt: new Date().toISOString(),
    };

    (findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue(
      mockPlacementPlan
    );

    let caughtError: any = null;

    try {
      await notifyPlacementProposalRejection(input);
      fail('Expected notifyPlacementProposalRejection to throw an error');
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.name || caughtError.constructor.name).toBe(
      'ProposalAlreadyProcessed'
    );
    expect(caughtError.message).toMatch(
      /この配置案は既に処理済みです。状態: EXECUTED/
    );
  });

  test('should throw ProposalAlreadyProcessed error when proposal status is REJECTED', async () => {
    const mockPlacementPlan = {
      id: 'PLAN-003',
      proposalId: 'PROP-001',
      status: 'REJECTED',
      affectedWorkerIds: ['W001', 'W002'],
      createdAt: new Date().toISOString(),
    };

    (findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue(
      mockPlacementPlan
    );

    let caughtError: any = null;

    try {
      await notifyPlacementProposalRejection(input);
      fail('Expected notifyPlacementProposalRejection to throw an error');
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.name || caughtError.constructor.name).toBe(
      'ProposalAlreadyProcessed'
    );
    expect(caughtError.message).toMatch(
      /この配置案は既に処理済みです。状態: REJECTED/
    );
  });

  test('should not call stub functions when ProposalAlreadyProcessed is thrown', async () => {
    const mockPlacementPlan = {
      id: 'PLAN-001',
      proposalId: 'PROP-001',
      status: 'APPROVED',
      affectedWorkerIds: ['W001', 'W002'],
      createdAt: new Date().toISOString(),
    };

    (findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue(
      mockPlacementPlan
    );

    try {
      await notifyPlacementProposalRejection(input);
      fail('Expected notifyPlacementProposalRejection to throw an error');
    } catch (error: any) {
      expect(error.name || error.constructor.name).toBe('ProposalAlreadyProcessed');
    }

    expect(updateAllocationChangeHistoryStatus).not.toHaveBeenCalled();
    expect(findUsersByRole).not.toHaveBeenCalled();
    expect(sendNotificationToAdministrator).not.toHaveBeenCalled();
    expect(sendPlacementChangeAuditLog).not.toHaveBeenCalled();
  });

  test('should not return NotifyPlacementProposalRejectionOutput when ProposalAlreadyProcessed error is thrown', async () => {
    const mockPlacementPlan = {
      id: 'PLAN-001',
      proposalId: 'PROP-001',
      status: 'APPROVED',
      affectedWorkerIds: ['W001', 'W002'],
      createdAt: new Date().toISOString(),
    };

    (findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue(
      mockPlacementPlan
    );

    let thrownError: any = null;

    try {
      await notifyPlacementProposalRejection(input);
      fail('Expected notifyPlacementProposalRejection to throw an error');
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError.name || thrownError.constructor.name).toBe(
      'ProposalAlreadyProcessed'
    );
    // Verify that the thrown error is not a successful output object
    expect(thrownError).toHaveProperty('message');
    expect(thrownError.message).toMatch(
      /この配置案は既に処理済みです。状態:/
    );
    // Ensure success property does not exist on error object
    if (typeof thrownError === 'object' && thrownError !== null) {
      expect('success' in thrownError && thrownError.success === true).toBeFalsy();
    }
  });
});