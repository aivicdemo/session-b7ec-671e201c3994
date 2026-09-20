import { getWorkerById } from '../../src/logic/data-persistence';

describe('SCEN-594: 作業者IDがデータベースに存在しないとき、WorkerNotFoundErrorを発生させる', () => {
  it('should throw WorkerNotFoundError when worker ID does not exist in database', async () => {
    const nonexistentWorkerId = 'NONEXISTENT_WORKER_001';

    const error = await getWorkerById({ workerId: nonexistentWorkerId }).catch(
      (err) => err
    );

    expect(error).toBeDefined();
    expect(error.name).toBe('WorkerNotFoundError');
    expect(error.message).toBe(
      '指定された作業者IDの作業者マスタが見つかりません。'
    );
  });
});