import { saveWorkInstruction } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual('../../src/logic/data-persistence'),
  getFacilityById: jest.fn(),
  getTeamById: jest.fn(),
  validateDateTimeRange: jest.fn(),
  validateNumericQuantity: jest.fn(),
  validateReferentialIntegrity: jest.fn(),
}));

describe('作業進捗・人員配置最適化エンジン - SCEN-674', () => {
  describe('更新時に既存の作業指示IDと変更後の値がすべて妥当だと、同じIDのまま内容が更新されて保存される', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('既存の作業指示を更新し、同じIDのまま内容が変更されて保存される', async () => {
      const existingWorkInstructionId = 'WI-001';
      const existingFacilityId = 'FAC-100';
      const existingTeamId = 'TEAM-A';
      const existingWorkInstructionNumber = 'WI-2024-0001';

      // 既存の作業指示レコードを準備する
      const existingWorkInstruction = {
        workInstructionId: existingWorkInstructionId,
        facilityId: existingFacilityId,
        teamId: existingTeamId,
        workInstructionNumber: existingWorkInstructionNumber,
        workName: 'ピッキング作業',
        workDescription: '元の説明',
        plannedStartDateTime: '2024-01-15T08:00:00',
        plannedEndDateTime: '2024-01-15T16:00:00',
        progressStatus: '未開始',
        progressRate: 0,
        requiredWorkerCount: 2,
        priority: '低',
        createdAt: '2024-01-14T00:00:00',
        updatedAt: '2024-01-14T00:00:00',
        createdBy: 'USER-001',
      };

      // getFacilityByIdをスタブ化し、拠点が存在することを返すよう設定
      (dataPersistence.getFacilityById as jest.Mock).mockResolvedValue({
        facilityId: existingFacilityId,
        facilityName: 'テスト拠点',
        facilityCode: 'FAC-100',
        address: '東京都',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: '拠点長',
        contactInfo: '03-0000-0000',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        createdBy: 'ADMIN',
      });

      // getTeamByIdをスタブ化し、チームが存在し定員が5名以上であることを返すよう設定
      (dataPersistence.getTeamById as jest.Mock).mockResolvedValue({
        teamId: existingTeamId,
        teamName: 'チームA',
        facilityId: existingFacilityId,
        teamLeaderId: 'LEADER-001',
        operatingStatus: 'active',
        capacity: 10,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        createdBy: 'ADMIN',
      });

      // validateDateTimeRangeをスタブ化し、日時範囲が妥当であることを返すよう設定
      (dataPersistence.validateDateTimeRange as jest.Mock).mockResolvedValue(true);

      // validateNumericQuantityをスタブ化し、必要人数が妥当であることを返すよう設定
      (dataPersistence.validateNumericQuantity as jest.Mock).mockResolvedValue(true);

      // validateReferentialIntegrityをスタブ化し、すべての参照整合性が成立することを返すよう設定
      (dataPersistence.validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);

      const updateInput = {
        workInstructionId: existingWorkInstructionId,
        facilityId: existingFacilityId,
        teamId: existingTeamId,
        workInstructionNumber: existingWorkInstructionNumber,
        workName: 'ピッキング作業（修正）',
        workDescription: '数量単位で修正',
        plannedStartDateTime: '2024-01-15T09:00:00',
        plannedEndDateTime: '2024-01-15T17:00:00',
        progressStatus: '進行中',
        progressRate: 50,
        requiredWorkerCount: 3,
        priority: '中',
        createdBy: 'USER-001',
        updatedBy: 'USER-002',
      };

      // 既存レコードが実際に存在することを前提条件として確認
      expect(existingWorkInstruction.workInstructionId).toBe(existingWorkInstructionId);

      const result = await saveWorkInstruction(updateInput);

      // 戻り値のworkInstructionIdが入力値のworkInstructionId='WI-001'と同じであることを確認
      expect(result.workInstructionId).toBe('WI-001');

      // 戻り値のisNewRecordがfalseであることを確認（更新操作を示す）
      expect(result.isNewRecord).toBe(false);

      // 戻り値のworkInstructionNumberが'WI-2024-0001'であることを確認
      expect(result.workInstructionNumber).toBe('WI-2024-0001');

      // 戻り値のfacilityIdが'FAC-100'であることを確認
      expect(result.facilityId).toBe('FAC-100');

      // 戻り値のteamIdが'TEAM-A'であることを確認
      expect(result.teamId).toBe('TEAM-A');

      // 戻り値のworkNameが'ピッキング作業（修正）'であることを確認（入力値の変更内容が反映されている）
      expect(result.workName).toBe('ピッキング作業（修正）');

      // すべての入力値の変更内容が永続化されたことを確認
      expect(result.workDescription).toBe('数量単位で修正');
      expect(result.progressStatus).toBe('進行中');
      expect(result.progressRate).toBe(50);
      expect(result.requiredWorkerCount).toBe(3);
      expect(result.priority).toBe('中');

      // 戻り値のsavedAtがISO 8601形式の有効な日時文字列であることを確認
      expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // getFacilityByIdが呼び出されたことを検証
      expect(dataPersistence.getFacilityById).toHaveBeenCalledWith({
        facilityId: existingFacilityId,
      });

      // getTeamByIdが呼び出されたことを検証
      expect(dataPersistence.getTeamById).toHaveBeenCalledWith({
        teamId: existingTeamId,
      });

      // validateDateTimeRangeが呼び出されたことを検証
      expect(dataPersistence.validateDateTimeRange).toHaveBeenCalled();

      // validateNumericQuantityが呼び出されたことを検証
      expect(dataPersistence.validateNumericQuantity).toHaveBeenCalled();

      // validateReferentialIntegrityが呼び出されたことを検証
      expect(dataPersistence.validateReferentialIntegrity).toHaveBeenCalled();
    });
  });
});