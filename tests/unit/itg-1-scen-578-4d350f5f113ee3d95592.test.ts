import { saveWorker, InvalidWorkerDataError } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-578: 稼働状況が空値のとき InvalidWorkerDataError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidWorkerDataError when operatingStatus is empty string', async () => {
    const input = {
      workerId: null,
      workerName: '山田太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: '仕分け',
      operatingStatus: '',
      hourlyRate: 1200,
      maxWorkingHours: 8,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    jest.spyOn(dataPersistence, 'validateInputFormat' as any).mockReturnValue(true);
    jest.spyOn(dataPersistence, 'getFacilityById' as any).mockResolvedValue({
      facilityId: 'FAC001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '拠点長',
      contactInfo: '09012345678',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    jest.spyOn(dataPersistence, 'getTeamById' as any).mockResolvedValue({
      teamId: 'TEAM001',
      teamName: 'テストチーム',
      facilityId: 'FAC001',
      teamLeaderId: 'LEADER001',
      teamDescription: 'テストチーム説明',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    await expect(saveWorker(input)).rejects.toThrow(InvalidWorkerDataError);
    await expect(saveWorker(input)).rejects.toThrow('作業者データの必須項目が不足または不正です。');
  });
});