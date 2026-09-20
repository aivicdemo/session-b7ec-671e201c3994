import { saveWorker } from '../../src/logic/data-persistence';

describe('SCEN-590: 時給が未指定でも保存が成功する', () => {
  it('should successfully save worker with undefined hourlyRate', async () => {
    const input = {
      workerId: null,
      workerName: '田中太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: 'ピッキング作業者',
      operatingStatus: '稼働中',
      hourlyRate: undefined,
      maxWorkingHours: 8,
      createdBy: 'admin_user',
    };

    const result = await saveWorker(input);

    expect(result.workerId).toBeDefined();
    expect(typeof result.workerId).toBe('string');
    expect(result.workerId).not.toBe('');
    expect(result.workerName).toBe('田中太郎');
    expect(result.facilityId).toBe('FAC001');
    expect(result.teamId).toBe('TEAM001');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.isNewRecord).toBe(true);
  });
});