import { findInitialAssignmentByWorker, FindInitialAssignmentByWorkerInput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-523: 指定された作業者IDに対応する有効な初期割当レコードが存在しないとき、InitialAssignmentNotFoundエラーが発生する', () => {
  it('should throw InitialAssignmentNotFound error when no initial assignment record exists for the worker', async () => {
    const workerId = 'worker-999999';
    const requestingUserId = 'user-001';

    // authorizeUserAction をスタブ化
    jest.spyOn(persistenceLayer, 'authorizeUserAction').mockResolvedValue(undefined);

    // findWorkerById をスタブ化
    jest.spyOn(persistenceLayer, 'findWorkerById').mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'ASSEMBLY',
      operatingStatus: 'active',
      hourlyRate: 1000,
      maxOperatingHours: 8,
      found: true,
    });

    const input: FindInitialAssignmentByWorkerInput = {
      workerId,
      requestingUserId,
    };

    let thrownError: any;
    try {
      await findInitialAssignmentByWorker(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('InitialAssignmentNotFound');
    expect(thrownError.message).toBe('初期割当レコードが見つかりません。');
  });
});