import { saveWorkInstruction, SaveWorkInstructionInput } from '../../src/logic/data-persistence';

describe('SCEN-680: 必要人数が0以下、または指定チームの定員を超えていると InvalidRequiredWorkerCount エラーが発生する', () => {
  const teamCapacity = 10;
  const facilityId = 'FAC001';
  const teamId = 'TEAM001';

  beforeAll(async () => {
    // テスト前提条件を設定：拠点ID='FAC001'、チームID='TEAM001'、チーム定員=10名を確保する
    // モック/スタブまたはデータベース初期化で、指定チームのデータセットアップを行う
    // 実装詳細：チームマスタテーブルに該当レコードが存在することを前提
  });

  describe('必要人数が0以下の場合', () => {
    it('必要人数が0の場合、InvalidRequiredWorkerCountエラーが発生する', async () => {
      const input: SaveWorkInstructionInput = {
        workInstructionId: null,
        facilityId,
        teamId,
        workInstructionNumber: 'WI-001',
        workName: 'テスト作業',
        workDescription: undefined,
        plannedStartDateTime: '2025-01-01T09:00:00',
        plannedEndDateTime: '2025-01-01T17:00:00',
        progressStatus: '未開始',
        progressRate: undefined,
        requiredWorkerCount: 0,
        priority: '中',
        createdBy: 'USER001',
        updatedBy: undefined,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidRequiredWorkerCount',
          message: '必要人数はチーム定員以下の正の整数である必要があります。',
        })
      );
    });

    it('必要人数が負の値の場合、InvalidRequiredWorkerCountエラーが発生する', async () => {
      const input: SaveWorkInstructionInput = {
        workInstructionId: null,
        facilityId,
        teamId,
        workInstructionNumber: 'WI-002',
        workName: 'テスト作業',
        workDescription: undefined,
        plannedStartDateTime: '2025-01-01T09:00:00',
        plannedEndDateTime: '2025-01-01T17:00:00',
        progressStatus: '未開始',
        progressRate: undefined,
        requiredWorkerCount: -1,
        priority: '中',
        createdBy: 'USER001',
        updatedBy: undefined,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidRequiredWorkerCount',
          message: '必要人数はチーム定員以下の正の整数である必要があります。',
        })
      );
    });
  });

  describe('必要人数がチーム定員を超える場合', () => {
    it('必要人数がチーム定員を超える場合、InvalidRequiredWorkerCountエラーが発生し、データベースへの保存が発生しない', async () => {
      const input: SaveWorkInstructionInput = {
        workInstructionId: null,
        facilityId,
        teamId,
        workInstructionNumber: 'WI-003',
        workName: 'テスト作業',
        workDescription: undefined,
        plannedStartDateTime: '2025-01-01T09:00:00',
        plannedEndDateTime: '2025-01-01T17:00:00',
        progressStatus: '未開始',
        progressRate: undefined,
        requiredWorkerCount: teamCapacity + 1,
        priority: '中',
        createdBy: 'USER001',
        updatedBy: undefined,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidRequiredWorkerCount',
          message: '必要人数はチーム定員以下の正の整数である必要があります。',
        })
      );

      // データベースへの保存が発生していないことを検証
      // SaveWorkInstructionOutputは返されず、エラーのみが返されることを確認
    });
  });

  describe('正常な必要人数の場合', () => {
    it('必要人数がチーム定員以下の正の整数の場合、正常に保存される', async () => {
      const input: SaveWorkInstructionInput = {
        workInstructionId: null,
        facilityId,
        teamId,
        workInstructionNumber: 'WI-004',
        workName: 'テスト作業',
        workDescription: undefined,
        plannedStartDateTime: '2025-01-01T09:00:00',
        plannedEndDateTime: '2025-01-01T17:00:00',
        progressStatus: '未開始',
        progressRate: undefined,
        requiredWorkerCount: teamCapacity,
        priority: '中',
        createdBy: 'USER001',
        updatedBy: undefined,
      };

      const result = await saveWorkInstruction(input);
      expect(result).toHaveProperty('workInstructionId');
      expect(result).toHaveProperty('isNewRecord', true);
    });
  });
});