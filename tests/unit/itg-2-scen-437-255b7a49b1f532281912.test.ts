import { findWorkerById, FindWorkerByIdInput, FindWorkerByIdOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-437: 作業者情報の取得', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な作業者IDとユーザーIDで、データベースに存在する作業者の情報を取得できる', async () => {
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);

    const input: FindWorkerByIdInput = {
      workerId: 'W00001',
      requestingUserId: 'U12345',
    };

    const result: FindWorkerByIdOutput = await findWorkerById(input);

    expect(result).toBeDefined();
    expect(result.found).toBe(true);
    expect(result.workerId).toBe('W00001');
    expect(result.workerName).toBe('山田太郎');
    expect(result.siteId).toBe('S001');
    expect(result.teamId).toBe('T100');
    expect(result.jobType).toBe('ピッキング');
    expect(result.operatingStatus).toBe('稼働中');
    expect(result.hourlyRate).toBe(1500);
    expect(result.maxOperatingHours).toBe(8.0);
  });
});