import { findPlacementPlanByWorkerAndDate } from '../../src/logic/persistence-layer';

describe('SCEN-500: 指定した作業者IDがマスタに存在しないときに、作業者が見つかりませんエラーが発生する', () => {
  it('should throw WorkerNotFound error when worker does not exist in master', async () => {
    const input = {
      workerId: 'WORKER-999',
      targetDate: new Date('2024-01-15'),
      requestingUserId: 'USER-001',
    };

    await expect(findPlacementPlanByWorkerAndDate(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'WorkerNotFound',
        message: '作業者が見つかりません。',
      })
    );
  });
});