import { findWorkerById, FindWorkerByIdInput, FindWorkerByIdOutput } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/authorization';

jest.mock('../../src/logic/authorization');

describe('SCEN-439: 指定された作業者IDがデータベースに存在しない場合、検索結果なしが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authModule.authorizeUserAction as jest.Mock).mockResolvedValue(true);
  });

  it('should return found=false when worker does not exist', async () => {
    const input: FindWorkerByIdInput = {
      workerId: 'WORKER-99999',
      requestingUserId: 'USER-001',
    };

    const result: FindWorkerByIdOutput = await findWorkerById(input);

    expect(result.found).toBe(false);
    expect(result.workerId).toBeUndefined();
    expect(result.workerName).toBeUndefined();
    expect(result.siteId).toBeUndefined();
    expect(result.teamId).toBeUndefined();
    expect(result.jobType).toBeUndefined();
    expect(result.operatingStatus).toBeUndefined();
    expect(result.hourlyRate).toBeUndefined();
    expect(result.maxOperatingHours).toBeUndefined();
  });
});