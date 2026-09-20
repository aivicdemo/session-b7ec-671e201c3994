import { saveWorker, SaveWorkerInput, SaveWorkerOutput, getWorkerById, GetWorkerByIdOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual('../../src/logic/data-persistence'),
  validateInputFormat: jest.fn(),
  getFacilityById: jest.fn(),
  getTeamById: jest.fn(),
}));

describe('SCEN-587: 作業者マスタデータ更新時に updatedBy が指定されると保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新時に updatedBy が指定されると保存される', async () => {
    const existingWorkerRecord: GetWorkerByIdOutput = {
      workerId: 'W001',
      workerName: '山田太郎',
      facilityId: 'F01',
      teamId: 'T01',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-10T09:00:00.000Z',
      createdBy: 'admin001',
      updatedBy: undefined,
    };

    (dataPersistence.validateInputFormat as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    (dataPersistence.getFacilityById as jest.Mock).mockResolvedValue({
      facilityId: 'F01',
      facilityName: 'テスト拠点',
      facilityCode: 'TES01',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '拠点長太郎',
      contactInfo: '090-XXXX-XXXX',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      createdBy: 'admin001',
    });

    (dataPersistence.getTeamById as jest.Mock).mockResolvedValue({
      teamId: 'T01',
      teamName: 'ピッキングチームA',
      facilityId: 'F01',
      teamLeaderId: 'L001',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      createdBy: 'admin001',
    });

    const input: SaveWorkerInput = {
      workerId: 'W001',
      workerName: '山田太郎',
      facilityId: 'F01',
      teamId: 'T01',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1200,
      maxWorkingHours: 8,
      createdBy: 'admin001',
      updatedBy: 'manager002',
    };

    const result: SaveWorkerOutput = await saveWorker(input);

    expect(result.workerId).toBe('W001');
    expect(result.workerName).toBe('山田太郎');
    expect(result.facilityId).toBe('F01');
    expect(result.teamId).toBe('T01');
    expect(result.isNewRecord).toBe(false);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    const savedRecord: GetWorkerByIdOutput = await getWorkerById({ workerId: 'W001' });

    expect(savedRecord.workerId).toBe('W001');
    expect(savedRecord.workerName).toBe('山田太郎');
    expect(savedRecord.facilityId).toBe('F01');
    expect(savedRecord.teamId).toBe('T01');
    expect(savedRecord.jobType).toBe('ピッキング');
    expect(savedRecord.operatingStatus).toBe('稼働中');
    expect(savedRecord.updatedBy).toBe('manager002');
  });
});