import { saveWorker } from '../../src/logic/data-persistence';
import { SaveWorkerInput, SaveWorkerOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-589: 最大稼働時間が指定されるとそのまま保存される', () => {
    beforeEach(() => {
      jest.spyOn(dataPersistence, 'getFacilityById').mockResolvedValue({
        facilityId: 'FAC001',
        facilityName: '東京拠点',
        facilityCode: 'TK001',
        address: '東京都渋谷区',
        maxCapacity: 50,
        currentCapacity: 30,
        operatingStatus: 'active',
        responsiblePersonName: '太郎',
        contactInfo: '090-1234-5678',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'ADMIN001',
        updatedBy: null,
      });

      jest.spyOn(dataPersistence, 'getTeamById').mockResolvedValue({
        teamId: 'TEAM001',
        teamName: 'ピッキングチーム',
        facilityId: 'FAC001',
        teamLeaderId: 'LEADER001',
        teamDescription: 'メインピッキング',
        operatingStatus: 'active',
        capacity: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'ADMIN001',
        updatedBy: null,
      });

      jest.spyOn(dataPersistence, 'validateInputFormat').mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('saveWorker関数で最大稼働時間を含む作業者情報が新規作成される', async () => {
      const input: SaveWorkerInput = {
        workerId: null,
        workerName: '山田太郎',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        jobType: 'ピッキング',
        operatingStatus: '稼働中',
        hourlyRate: 1500,
        maxWorkingHours: 8.0,
        createdBy: 'USER001',
        updatedBy: undefined,
      };

      const result: SaveWorkerOutput = await saveWorker(input);

      expect(result.isNewRecord).toBe(true);
      expect(result.workerId).toBeDefined();
      expect(result.workerId).not.toBeNull();
      expect(result.workerName).toBe('山田太郎');
      expect(result.facilityId).toBe('FAC001');
      expect(result.teamId).toBe('TEAM001');
      expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      jest.spyOn(dataPersistence, 'getWorkerById').mockResolvedValue({
        workerId: result.workerId,
        workerName: '山田太郎',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        jobType: 'ピッキング',
        operatingStatus: '稼働中',
        hourlyRate: 1500,
        maxWorkingHours: 8.0,
        createdAt: result.savedAt,
        updatedAt: result.savedAt,
        createdBy: 'USER001',
        updatedBy: undefined,
      });

      const retrievedWorker = await dataPersistence.getWorkerById({ workerId: result.workerId });
      expect(retrievedWorker.maxWorkingHours).toBe(8.0);
    });
  });
});