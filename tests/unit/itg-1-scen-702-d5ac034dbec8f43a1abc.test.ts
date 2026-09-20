import { jest } from '@jest/globals';
import { saveWorkResult, getWorkerById, getWorkInstructionById, getFacilityById, getTeamById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - 作業実績データ永続化', () => {
  describe('SCEN-702: 指定された作業者IDが存在しないとWorkerNotFoundエラーが発生する', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('存在しない作業者IDを指定した場合、WorkerNotFoundエラーが発生し、データベースに永続化されない', async () => {
      // 他の必須リソース（作業指示、拠点、チーム）の存在確認スタブは正常系を返す
      jest.mocked(getWorkInstructionById).mockResolvedValue({
        workInstructionId: 'WI_001',
        facilityId: 'FAC_001',
        teamId: 'TEAM_001',
        workInstructionNumber: 'WI-2025-001',
        workName: 'テスト作業',
        workDescription: null,
        plannedStartDateTime: '2025-01-15T08:00:00Z',
        plannedEndDateTime: '2025-01-15T17:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: null,
        requiredWorkerCount: 5,
        priority: '中',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'USER_001',
        updatedBy: null,
      });

      jest.mocked(getFacilityById).mockResolvedValue({
        facilityId: 'FAC_001',
        facilityName: 'テスト拠点',
        facilityCode: 'FAC_001_CODE',
        address: 'テスト住所',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: '責任者',
        contactInfo: '09012345678',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'USER_001',
        updatedBy: null,
      });

      jest.mocked(getTeamById).mockResolvedValue({
        teamId: 'TEAM_001',
        teamName: 'テストチーム',
        facilityId: 'FAC_001',
        teamLeaderId: 'LEADER_001',
        teamDescription: null,
        operatingStatus: 'active',
        capacity: 10,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'USER_001',
        updatedBy: null,
      });

      // getWorkerByIdスタブ：指定された作業者IDに対してnullを返す
      jest.mocked(getWorkerById).mockResolvedValue(null);

      const input = {
        workResultId: null,
        workInstructionId: 'WI_001',
        workerId: 'WORKER_NONEXISTENT_999',
        facilityId: 'FAC_001',
        teamId: 'TEAM_001',
        actualStartDateTime: '2025-01-15T08:00:00Z',
        actualEndDateTime: '2025-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: '完了',
        defectCount: null,
        remarks: null,
        createdBy: 'USER_001',
        updatedBy: null,
      };

      let thrownError: any;
      try {
        await saveWorkResult(input);
      } catch (error: any) {
        thrownError = error;
      }

      // WorkerNotFoundエラーが発生したことを確認
      expect(thrownError).toBeDefined();
      expect(thrownError.name).toBe('WorkerNotFoundError');
      expect(thrownError.message).toBe('作業者が見つかりません。作業者ID: WORKER_NONEXISTENT_999');

      // 作業者確認が呼び出されたことを確認
      expect(jest.mocked(getWorkerById)).toHaveBeenCalledWith({ workerId: 'WORKER_NONEXISTENT_999' });

      // SaveWorkResultOutputが返されないことを確認（例外がスローされている）
      expect(thrownError).toBeInstanceOf(Error);
    });

    it('存在しない作業者IDに対してundefinedが返される場合も、WorkerNotFoundエラーが発生する', async () => {
      // 他の必須リソース（作業指示、拠点、チーム）の存在確認スタブは正常系を返す
      jest.mocked(getWorkInstructionById).mockResolvedValue({
        workInstructionId: 'WI_001',
        facilityId: 'FAC_001',
        teamId: 'TEAM_001',
        workInstructionNumber: 'WI-2025-001',
        workName: 'テスト作業',
        workDescription: null,
        plannedStartDateTime: '2025-01-15T08:00:00Z',
        plannedEndDateTime: '2025-01-15T17:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: null,
        requiredWorkerCount: 5,
        priority: '中',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'USER_001',
        updatedBy: null,
      });

      jest.mocked(getFacilityById).mockResolvedValue({
        facilityId: 'FAC_001',
        facilityName: 'テスト拠点',
        facilityCode: 'FAC_001_CODE',
        address: 'テスト住所',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: '責任者',
        contactInfo: '09012345678',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'USER_001',
        updatedBy: null,
      });

      jest.mocked(getTeamById).mockResolvedValue({
        teamId: 'TEAM_001',
        teamName: 'テストチーム',
        facilityId: 'FAC_001',
        teamLeaderId: 'LEADER_001',
        teamDescription: null,
        operatingStatus: 'active',
        capacity: 10,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'USER_001',
        updatedBy: null,
      });

      // getWorkerByIdスタブ：指定された作業者IDに対してundefinedを返す
      jest.mocked(getWorkerById).mockResolvedValue(undefined as any);

      const input = {
        workResultId: null,
        workInstructionId: 'WI_001',
        workerId: 'WORKER_NONEXISTENT_999',
        facilityId: 'FAC_001',
        teamId: 'TEAM_001',
        actualStartDateTime: '2025-01-15T08:00:00Z',
        actualEndDateTime: '2025-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: '完了',
        defectCount: null,
        remarks: null,
        createdBy: 'USER_001',
        updatedBy: null,
      };

      let thrownError: any;
      try {
        await saveWorkResult(input);
      } catch (error: any) {
        thrownError = error;
      }

      // WorkerNotFoundエラーが発生したことを確認
      expect(thrownError).toBeDefined();
      expect(thrownError.name).toBe('WorkerNotFoundError');
      expect(thrownError.message).toBe('作業者が見つかりません。作業者ID: WORKER_NONEXISTENT_999');

      // 作業者確認が呼び出されたことを確認
      expect(jest.mocked(getWorkerById)).toHaveBeenCalledWith({ workerId: 'WORKER_NONEXISTENT_999' });

      // SaveWorkResultOutputが返されないことを確認
      expect(thrownError).toBeInstanceOf(Error);
    });
  });
});