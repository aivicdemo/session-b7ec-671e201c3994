import { saveWorker, SaveWorkerInput, SaveWorkerOutput } from '../../src/logic/persistence-layer';

describe('SCEN-436: 任意項目が未設定の入力で作業者新規作成に成功する', () => {
  it('hourlyRate と maxOperatingHours が未設定の状態で saveWorker が新規作成に成功する', async () => {
    const input: SaveWorkerInput = {
      workerId: 'W001',
      workerName: '山田太郎',
      siteId: 'SITE001',
      teamId: 'TEAM-A',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdBy: 'USER123',
      requestingUserId: 'USER123',
    };

    const result = await saveWorker(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.workerId).toBe('W001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });
});