import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as authAuthorizationAudit from '../../src/logic/auth-authorization-audit';

describe('SCEN-080: 新規配属作業者の初期割当判断を自律実行 - WorkerNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された作業者IDが作業者マスタに存在しないため、WorkerNotFoundErrorが発生する', async () => {
    // Given: テスト対象の入力値を以下のように設定
    const input = {
      workerId: 'WORKER-999999',
      executingUserId: 'USER-ADMIN-001',
    };

    // When: 後続処理が呼び出されていないことを確認するため、すべてのスパイを事前に設定
    const getLatestProductivityDataByWorkerSpy = jest
      .spyOn(dataPersistence, 'getLatestProductivityDataByWorker')
      .mockResolvedValue([]);
    const generateAllocationPlansSpy = jest
      .spyOn(dataPersistence, 'generateAllocationPlans' as any)
      .mockResolvedValue([]);
    const saveAllocationPlanSpy = jest
      .spyOn(dataPersistence, 'saveAllocationPlan' as any)
      .mockResolvedValue({});

    // And: スタブ設定 - getWorkerById を設定し、指定IDに対して null を返す
    jest.spyOn(dataPersistence, 'getWorkerById').mockResolvedValue(null);

    // And: authorizeOperation を設定し、権限ありを返す
    jest.spyOn(authAuthorizationAudit, 'authorizeOperation').mockResolvedValue(true);

    // When: runTx5Imp1Agent を実行
    let thrownError: Error | null = null;
    try {
      await runTx5Imp1Agent(input, {} as any);
    } catch (error) {
      thrownError = error as Error;
    }

    // Then: WorkerNotFoundError が throw されたことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError?.constructor.name).toBe('WorkerNotFoundError');

    // And: エラーメッセージが期待値であることを確認
    expect(thrownError?.message).toBe('指定された作業者が見つかりません。作業者ID: WORKER-999999');

    // And: getWorkerById への呼び出しが1回だけ発生していることを確認
    expect(dataPersistence.getWorkerById).toHaveBeenCalledTimes(1);
    expect(dataPersistence.getWorkerById).toHaveBeenCalledWith('WORKER-999999');

    // And: 後続処理が呼び出されていないことを確認
    expect(getLatestProductivityDataByWorkerSpy).not.toHaveBeenCalled();
    expect(generateAllocationPlansSpy).not.toHaveBeenCalled();
    expect(saveAllocationPlanSpy).not.toHaveBeenCalled();
  });
});