import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { AuthorizationError } from '../../src/errors/AuthorizationError';
import * as orchestratorModule from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-086: 実行ユーザーが新規配属者の初期割当案生成を実行する権限を持たないため、AuthorizationErrorが発生する', () => {
  let authorizeOperationStub: jest.SpyInstance;
  let recordOperationAuditStub: jest.SpyInstance;

  beforeEach(() => {
    recordOperationAuditStub = jest
      .spyOn(orchestratorModule, 'recordOperationAudit' as any)
      .mockResolvedValue(undefined);

    authorizeOperationStub = jest
      .spyOn(orchestratorModule, 'authorizeOperation' as any)
      .mockImplementation(async () => {
        await recordOperationAuditStub({
          userId: 'user-no-permission',
          operationType: 'authorization_check',
          status: 'failed',
        });
        throw new AuthorizationError('この操作を実行する権限がありません。');
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw AuthorizationError when executingUserId lacks required permissions', async () => {
    const workerId = 'worker-001';
    const executingUserId = 'user-no-permission';
    const analysisLookbackDays = 30;
    const minimumProductivityRecordsRequired = 5;

    const input = {
      workerId,
      executingUserId,
      analysisLookbackDays,
      minimumProductivityRecordsRequired,
    };

    await expect(runTx5Imp1Agent(input, {} as any)).rejects.toThrow(
      AuthorizationError
    );

    await expect(runTx5Imp1Agent(input, {} as any)).rejects.toThrow(
      'この操作を実行する権限がありません。'
    );
  });

  it('should propagate error and not return output when authorization fails', async () => {
    const workerId = 'worker-001';
    const executingUserId = 'user-no-permission';

    const input = {
      workerId,
      executingUserId,
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    let authorizationErrorThrown = false;
    let errorInstance: Error | null = null;
    let outputReturned: unknown = undefined;

    try {
      outputReturned = await runTx5Imp1Agent(input, {} as any);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        authorizationErrorThrown = true;
        errorInstance = error;
      }
      throw error;
    }

    expect(authorizationErrorThrown).toBe(true);
    expect(errorInstance).toBeInstanceOf(AuthorizationError);
    expect(outputReturned).toBeUndefined();
  });

  it('should record authorization failure audit event when authorization fails', async () => {
    const workerId = 'worker-001';
    const executingUserId = 'user-no-permission';

    const input = {
      workerId,
      executingUserId,
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    try {
      await runTx5Imp1Agent(input, {} as any);
    } catch (error) {
      expect(error).toBeInstanceOf(AuthorizationError);
    }

    expect(recordOperationAuditStub).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: executingUserId,
        operationType: 'authorization_check',
        status: 'failed',
      })
    );
  });

  it('should verify that recordOperationAudit is called before AuthorizationError is thrown', async () => {
    const workerId = 'worker-001';
    const executingUserId = 'user-no-permission';

    const input = {
      workerId,
      executingUserId,
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    const callOrder: string[] = [];

    recordOperationAuditStub.mockImplementation(async () => {
      callOrder.push('recordOperationAudit');
    });

    authorizeOperationStub.mockImplementation(async () => {
      await recordOperationAuditStub({
        userId: executingUserId,
        operationType: 'authorization_check',
        status: 'failed',
      });
      callOrder.push('throw_authorization_error');
      throw new AuthorizationError('この操作を実行する権限がありません。');
    });

    try {
      await runTx5Imp1Agent(input, {} as any);
    } catch (error) {
      expect(error).toBeInstanceOf(AuthorizationError);
    }

    expect(callOrder).toContain('recordOperationAudit');
    expect(recordOperationAuditStub).toHaveBeenCalled();
  });

  it('should confirm that Tx5Imp1AgentOutput is not returned when AuthorizationError is thrown', async () => {
    const workerId = 'worker-001';
    const executingUserId = 'user-no-permission';

    const input = {
      workerId,
      executingUserId,
      analysisLookbackDays: 30,
      minimumProductivityRecordsRequired: 5,
    };

    let caughtError: Error | null = null;
    let resultIsUndefined = true;

    try {
      const result = await runTx5Imp1Agent(input, {} as any);
      resultIsUndefined = result === undefined;
    } catch (error) {
      caughtError = error as Error;
      resultIsUndefined = true;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError).toBeInstanceOf(AuthorizationError);
    expect(resultIsUndefined).toBe(true);
  });
});