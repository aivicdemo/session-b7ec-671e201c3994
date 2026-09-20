import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveWorker, SaveWorkerInput, SaveWorkerOutput } from '../../src/logic/data-persistence';

describe('SCEN-570: 新規作業者を必須項目すべて正しく指定して保存', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作業者を必須項目すべて正しく指定して保存すると、生成されたIDと保存日時を含む新規レコードが返される', async () => {
    const input: SaveWorkerInput = {
      workerId: null,
      workerName: '田中太郎',
      facilityId: 'FAC-001',
      teamId: 'TEAM-A01',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdBy: 'USER-123',
      updatedBy: undefined,
    };

    const beforeCall = new Date();
    const result = await saveWorker(input);
    const afterCall = new Date();

    expect(result).toBeDefined();
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('workerName');
    expect(result).toHaveProperty('facilityId');
    expect(result).toHaveProperty('teamId');
    expect(result).toHaveProperty('savedAt');
    expect(result).toHaveProperty('isNewRecord');

    expect(result.workerId).not.toBeNull();
    expect(typeof result.workerId).toBe('string');
    expect(result.workerId.length).toBeGreaterThan(0);
    expect(result.workerId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);

    expect(result.workerName).toBe('田中太郎');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-A01');

    const savedAtTime = new Date(result.savedAt);
    expect(savedAtTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 5000);
    expect(savedAtTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 5000);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    expect(result.isNewRecord).toBe(true);
  });
});