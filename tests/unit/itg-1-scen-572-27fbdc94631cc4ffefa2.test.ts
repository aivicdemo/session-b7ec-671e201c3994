import { saveWorker } from '../../src/logic/data-persistence';

describe('SCEN-572: saveWorker新規作成で isNewRecord が true として返される', () => {
  it('workerId未指定の新規作成でisNewRecordがtrueとして返される', async () => {
    const input = {
      workerId: null,
      workerName: '山田太郎',
      facilityId: 'FAC-001',
      teamId: 'TEAM-A',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdBy: 'user-123',
      updatedBy: undefined,
    };

    const result = await saveWorker(input);

    expect(result).toBeDefined();
    expect(result.isNewRecord).toBe(true);
    expect(result.workerId).toBeDefined();
    expect(typeof result.workerId).toBe('string');
    expect(result.workerId).not.toBe('');
    expect(result.workerName).toBe('山田太郎');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-A');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});