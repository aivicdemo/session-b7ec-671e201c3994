import { saveWorkResult } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-704: saveWorkResult エラーハンドリング', () => {
  describe('指定されたチームIDが存在しないとTeamNotFoundエラーが発生する', () => {
    beforeEach(() => {
      jest.spyOn(dataPersistence, 'getWorkInstructionById').mockResolvedValue({
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        workInstructionNumber: 'WI-001',
        workName: 'サンプル作業',
        workDescription: null,
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '未開始',
        progressRate: 0,
        requiredWorkerCount: 5,
        priority: '中',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      });

      jest.spyOn(dataPersistence, 'getWorkerById').mockResolvedValue({
        workerId: 'WKR-001',
        workerName: 'テスト作業者',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        jobType: '組立',
        operatingStatus: '稼働中',
        hourlyRate: 1500,
        maxWorkingHours: 8,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      });

      jest.spyOn(dataPersistence, 'getFacilityById').mockResolvedValue({
        facilityId: 'FAC-001',
        facilityName: 'テスト拠点',
        facilityCode: 'FAC-001',
        address: 'テスト住所',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: 'テスト責任者',
        contactInfo: '090-0000-0000',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'USER-001',
        updatedBy: null,
      });

      jest.spyOn(dataPersistence, 'getTeamById').mockImplementation((teamId) => {
        if (teamId === 'TEAM-INVALID') {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          teamId: teamId,
          teamName: 'テストチーム',
          facilityId: 'FAC-001',
          teamLeaderId: 'LEAD-001',
          teamDescription: null,
          operatingStatus: 'active',
          capacity: 10,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'USER-001',
          updatedBy: null,
        });
      });

      jest.spyOn(dataPersistence, 'validateNumericQuantity').mockResolvedValue(true);

      jest.spyOn(dataPersistence, 'validateDateTimeRange').mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('チームが見つからない場合、TeamNotFoundエラーをスローする', async () => {
      const input = {
        workResultId: null,
        workInstructionId: 'WI-001',
        workerId: 'WKR-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-INVALID',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: '進行中',
        defectCount: null,
        remarks: null,
        createdBy: 'USER-001',
        updatedBy: null,
      };

      await expect(saveWorkResult(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'TeamNotFound',
          message: 'チームが見つかりません。チームID: TEAM-INVALID',
        })
      );
    });
  });
});