import {
  saveWorkResult,
  getWorkResultById,
} from '../../src/logic/data-persistence';

describe('作業実績データ永続化', () => {
  describe('SCEN-708: 完了状態の作業実績更新エラー', () => {
    it('既に完了状態の作業実績を更新しようとするとWorkResultAlreadyCompletedエラーが発生する', async () => {
      // 1. 既に完了状態の作業実績を事前に作成
      const createdResult = await saveWorkResult({
        workResultId: null,
        workInstructionId: 'WI-001',
        workerId: 'WR-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        actualQuantity: 100,
        workStatus: '完了',
        createdBy: 'USER-001',
      });

      expect(createdResult).toBeDefined();
      expect(createdResult.isNewRecord).toBe(true);
      const workResultId = createdResult.workResultId;
      expect(workResultId).toBeDefined();

      // 2. 同じ workResultId を指定して saveWorkResult を再度呼び出す
      let thrownError: any;
      try {
        await saveWorkResult({
          workResultId,
          workInstructionId: 'WI-001',
          workerId: 'WR-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          actualStartDateTime: '2024-01-15T09:00:00Z',
          actualEndDateTime: '2024-01-15T18:00:00Z',
          actualQuantity: 50,
          workStatus: '進行中',
          updatedBy: 'USER-002',
        });
      } catch (error) {
        thrownError = error;
      }

      // 3. WorkResultAlreadyCompleted エラーが発生することを確認
      expect(thrownError).toBeDefined();
      expect(thrownError.name).toBe('WorkResultAlreadyCompleted');
      expect(thrownError.message).toContain('完了済みの作業実績は更新できません');
      expect(thrownError.message).toContain(workResultId);
    });
  });
});