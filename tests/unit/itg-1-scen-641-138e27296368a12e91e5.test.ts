import { saveProficiency } from '../../src/logic/data-persistence';

describe('SCEN-641: 作業者習熟度データを新規作成または更新して永続化し、作業者の職務別スキルレベルと習熟度を一元管理する。', () => {
  describe('evaluationDateが本日である場合は評価日として受け入れられる', () => {
    it('should accept today\'s date as evaluationDate and return new proficiency record', async () => {
      // 本日の日付を ISO 8601形式（YYYY-MM-DD）で取得する
      const today = new Date();
      const isoToday = today.toISOString().split('T')[0];

      // saveProficiency を以下の入力で呼び出す
      const result = await saveProficiency({
        proficiencyId: null,
        workerId: 'W001',
        jobType: '梱包',
        proficiencyLevel: '中級',
        evaluationDate: isoToday,
        evaluatedBy: 'E001',
        createdBy: 'C001',
        remarks: null,
        updatedBy: undefined,
      });

      // saveProficiency の戻り値を検証する
      // proficiencyId は新規ID（null でない string）
      expect(result.proficiencyId).toBeDefined();
      expect(typeof result.proficiencyId).toBe('string');
      expect(result.proficiencyId).not.toBe('');

      // workerId は 'W001'
      expect(result.workerId).toBe('W001');

      // jobType は '梱包'
      expect(result.jobType).toBe('梱包');

      // proficiencyLevel は '中級'
      expect(result.proficiencyLevel).toBe('中級');

      // savedAt は保存時刻（ISO 8601形式の有効な日時）
      expect(result.savedAt).toBeDefined();
      expect(typeof result.savedAt).toBe('string');
      // ISO 8601形式の検証
      expect(() => new Date(result.savedAt)).not.toThrow();
      // 保存時刻が現在の時刻に近いことを確認（5分以内）
      const savedTime = new Date(result.savedAt).getTime();
      const nowTime = new Date().getTime();
      expect(Math.abs(savedTime - nowTime)).toBeLessThan(5 * 60 * 1000);

      // isNewRecord は true
      expect(result.isNewRecord).toBe(true);
    });
  });
});