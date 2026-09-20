import { saveWorkResult } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-701: 作業実績データを新規作成または更新して永続化し、作業者の実績数量・完了日時・ステータスを一元管理する', () => {
  describe('指定された作業指示IDが存在しないとWorkInstructionNotFoundエラーが発生する', () => {
    beforeEach(() => {
      jest.spyOn(dataPersistence, 'getWorkInstructionById' as any).mockResolvedValue(null);
      jest.spyOn(dataPersistence, 'getWorkerById' as any).mockResolvedValue({
        workerId: 'WKR001',
        workerName: 'テスト作業者',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        jobType: 'standard',
        operatingStatus: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'USR001',
      });
      jest.spyOn(dataPersistence, 'getFacilityById' as any).mockResolvedValue({
        facilityId: 'FAC001',
        facilityName: 'テスト拠点',
        facilityCode: 'FAC001',
        address: 'テスト住所',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: 'テスト責任者',
        contactInfo: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'USR001',
      });
      jest.spyOn(dataPersistence, 'getTeamById' as any).mockResolvedValue({
        teamId: 'TEAM001',
        teamName: 'テストチーム',
        facilityId: 'FAC001',
        teamLeaderId: 'USR001',
        operatingStatus: 'active',
        capacity: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'USR001',
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw WorkInstructionNotFound error with correct message format when work instruction does not exist', async () => {
      const input = {
        workResultId: undefined,
        workInstructionId: 'NON_EXISTENT_WI_001',
        workerId: 'WKR001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T10:00:00Z',
        actualQuantity: 50,
        workStatus: '進行中',
        defectCount: undefined,
        remarks: undefined,
        createdBy: 'USR001',
        updatedBy: undefined,
      };

      try {
        await saveWorkResult(input);
        fail('Expected WorkInstructionNotFound error to be thrown');
      } catch (error: any) {
        expect(error.name).toBe('WorkInstructionNotFound');
        expect(error.message).toBe('作業指示が見つかりません。作業指示ID: NON_EXISTENT_WI_001');
      }
    });

    it('should not return SaveWorkResultOutput when WorkInstructionNotFound error is thrown', async () => {
      const input = {
        workResultId: undefined,
        workInstructionId: 'NON_EXISTENT_WI_001',
        workerId: 'WKR001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T10:00:00Z',
        actualQuantity: 50,
        workStatus: '進行中',
        defectCount: undefined,
        remarks: undefined,
        createdBy: 'USR001',
        updatedBy: undefined,
      };

      let result: any = undefined;
      let errorThrown = false;

      try {
        result = await saveWorkResult(input);
        errorThrown = false;
      } catch (error: any) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(true);
      expect(result).toBeUndefined();
    });
  });
});