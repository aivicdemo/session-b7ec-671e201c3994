import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authModule from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-008: Tx1Imp1Agent - Unauthorized User Execution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return UnauthorizedAgentExecution error when executing user is not admin or system admin', async () => {
    // Arrange
    const input = {
      executingUserId: 'user-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: undefined,
      targetTeamIds: undefined,
    };

    const unauthorizedError = new Error('このエージェント処理を実行する権限がありません。');
    (unauthorizedError as any).name = 'UnauthorizedAgentExecution';

    (authModule.authorizeUserAction as jest.Mock).mockImplementation(() => {
      throw unauthorizedError;
    });

    // Act & Assert
    let caughtError: any;
    try {
      await runTx1Imp1Agent(input, {} as any);
      fail('Expected error to be thrown');
    } catch (error) {
      caughtError = error;
    }

    // Verify error object structure
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('UnauthorizedAgentExecution');
    expect(caughtError.message).toContain('このエージェント処理を実行する権限がありません。');
    
    // Verify authorization was called
    expect(authModule.authorizeUserAction).toHaveBeenCalled();
    expect(authModule.authorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({
        executingUserId: 'user-001',
      })
    );
  });

  it('should not call any business logic when authorization fails', async () => {
    // Arrange
    const input = {
      executingUserId: 'user-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: undefined,
      targetTeamIds: undefined,
    };

    const unauthorizedError = new Error('このエージェント処理を実行する権限がありません。');
    (unauthorizedError as any).name = 'UnauthorizedAgentExecution';

    (authModule.authorizeUserAction as jest.Mock).mockImplementation(() => {
      throw unauthorizedError;
    });

    // Mock business logic functions to ensure they are not called
    jest.mock('../../src/logic/progress-monitoring', () => ({
      monitorProgressAndDetectDelayRisk: jest.fn(),
    }));

    jest.mock('../../src/logic/performance-analysis', () => ({
      aggregatePerformanceDataByPeriod: jest.fn(),
    }));

    jest.mock('../../src/logic/personnel-reallocation', () => ({
      judgePersonnelReallocationFeasibility: jest.fn(),
    }));

    // Act
    let caughtError: any;
    try {
      await runTx1Imp1Agent(input, {} as any);
    } catch (error) {
      caughtError = error;
    }

    // Assert - authorization should be called exactly once
    expect(authModule.authorizeUserAction).toHaveBeenCalledTimes(1);

    // Verify error was thrown
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('UnauthorizedAgentExecution');
  });

  it('should not return Tx1Imp1AgentOutput when authorization fails', async () => {
    // Arrange
    const input = {
      executingUserId: 'user-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: undefined,
      targetTeamIds: undefined,
    };

    const unauthorizedError = new Error('このエージェント処理を実行する権限がありません。');
    (unauthorizedError as any).name = 'UnauthorizedAgentExecution';

    (authModule.authorizeUserAction as jest.Mock).mockImplementation(() => {
      throw unauthorizedError;
    });

    // Act & Assert
    let result: any;
    try {
      result = await runTx1Imp1Agent(input, {} as any);
      fail('Expected error to be thrown');
    } catch (error) {
      result = error;
    }

    // Verify that result is an error object, not Tx1Imp1AgentOutput
    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('UnauthorizedAgentExecution');
    expect(result).not.toHaveProperty('executionStatus');
    expect(result).not.toHaveProperty('delayRiskDetected');
    expect(result).not.toHaveProperty('qualityVarianceDetected');
    expect(result).not.toHaveProperty('affectedSiteIds');
    expect(result).not.toHaveProperty('placementProposalId');
    expect(result).not.toHaveProperty('placementInstructionDeliveryStatus');
    expect(result).not.toHaveProperty('workExecutionRecordIds');
    expect(result).not.toHaveProperty('executionTimestamp');
    expect(result).not.toHaveProperty('errorDetails');
  });
});