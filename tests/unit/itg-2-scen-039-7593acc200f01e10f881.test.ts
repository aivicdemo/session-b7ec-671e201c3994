import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as authModule from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-039: Unauthorized user cannot execute Tx4Imp1Agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAgentExecution error when user lacks agent execution permission', async () => {
    const unauthorizedUserAuth = {
      userId: 'user-without-permission',
      userName: 'viewerUser',
      permissionLevel: 'viewer',
      hasAgentExecutionPermission: false,
    };

    (authModule.authenticateUser as jest.Mock).mockResolvedValue(unauthorizedUserAuth);

    const input = {
      triggerType: 'manual' as const,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      delayRiskThreshold: 70,
      executingUserId: 'user-without-permission',
      contextData: { receivedOrderId: 'ORD-12345' },
    };

    const mockAiClient = {
      callAiAction: jest.fn(),
    };

    try {
      await runTx4Imp1Agent(input, mockAiClient as any);
      fail('Should have thrown UnauthorizedAgentExecution error');
    } catch (error: any) {
      expect(error.code).toBe('UnauthorizedAgentExecution');
      expect(error.message).toBe('このエージェント処理を実行する権限がありません。');
      expect(error.errorDetails).toBeDefined();
      expect(error.errorDetails).toBeInstanceOf(Array);
    }
  });

  it('should not perform any subsequent processing when authorization fails', async () => {
    const unauthorizedUserAuth = {
      userId: 'viewer-user-123',
      userName: 'restrictedViewer',
      permissionLevel: 'viewer',
      hasAgentExecutionPermission: false,
    };

    (authModule.authenticateUser as jest.Mock).mockResolvedValue(unauthorizedUserAuth);

    const input = {
      triggerType: 'manual' as const,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      delayRiskThreshold: 70,
      executingUserId: 'viewer-user-123',
      contextData: { receivedOrderId: 'ORD-12345' },
    };

    const mockAiClient = {
      callAiAction: jest.fn(),
    };

    try {
      await runTx4Imp1Agent(input, mockAiClient as any);
      fail('Should have thrown UnauthorizedAgentExecution error');
    } catch (error: any) {
      expect(error.code).toBe('UnauthorizedAgentExecution');
      expect(mockAiClient.callAiAction).not.toHaveBeenCalled();
    }
  });

  it('should include authorization error details with errorDetails field when UnauthorizedAgentExecution occurs', async () => {
    const unauthorizedUserAuth = {
      userId: 'unprivileged-user',
      userName: 'limitedUser',
      permissionLevel: 'viewer',
      hasAgentExecutionPermission: false,
    };

    (authModule.authenticateUser as jest.Mock).mockResolvedValue(unauthorizedUserAuth);

    const input = {
      triggerType: 'manual' as const,
      targetSiteIds: ['SITE-001'],
      delayRiskThreshold: 70,
      executingUserId: 'unprivileged-user',
      contextData: {},
    };

    const mockAiClient = {
      callAiAction: jest.fn(),
    };

    try {
      await runTx4Imp1Agent(input, mockAiClient as any);
      fail('Should have thrown UnauthorizedAgentExecution error');
    } catch (error: any) {
      expect(error.code).toBe('UnauthorizedAgentExecution');
      expect(error.message).toBe('このエージェント処理を実行する権限がありません。');
      expect(error.errorDetails).toBeDefined();
      expect(Array.isArray(error.errorDetails)).toBe(true);
      if (error.errorDetails && error.errorDetails.length > 0) {
        expect(error.errorDetails[0]).toHaveProperty('code');
        expect(error.errorDetails[0]).toHaveProperty('message');
      }
    }
  });

  it('should not execute progress monitoring when authorization fails', async () => {
    const unauthorizedUserAuth = {
      userId: 'no-permission-user',
      userName: 'restrictedUser',
      permissionLevel: 'viewer',
      hasAgentExecutionPermission: false,
    };

    (authModule.authenticateUser as jest.Mock).mockResolvedValue(unauthorizedUserAuth);

    const input = {
      triggerType: 'manual' as const,
      targetSiteIds: ['SITE-001', 'SITE-002'],
      delayRiskThreshold: 70,
      executingUserId: 'no-permission-user',
      contextData: { receivedOrderId: 'ORD-12345' },
    };

    const mockAiClient = {
      callAiAction: jest.fn(),
    };

    try {
      await runTx4Imp1Agent(input, mockAiClient as any);
      fail('Should have thrown UnauthorizedAgentExecution error');
    } catch (error: any) {
      expect(error.code).toBe('UnauthorizedAgentExecution');
      expect(mockAiClient.callAiAction).not.toHaveBeenCalled();
    }
  });
});