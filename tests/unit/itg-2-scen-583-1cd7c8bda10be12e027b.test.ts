import { saveWorkType } from '../../src/logic/persistence-layer';

describe('SCEN-583: 標準生産性が負数の場合エラーが発生する', () => {
  it('標準生産性が負数の場合、エラーをスローするか success=false で返す', async () => {
    const input = {
      workTypeId: 'WT-001',
      workTypeName: 'ピッキング作業',
      standardProductivity: -5.5,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create' as const,
    };

    try {
      const result = await saveWorkType(input);
      expect(result.success).toBe(false);
      expect(result.message).toContain('標準生産性は0以上の数値である必要があります。');
    } catch (error) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.message).toContain('標準生産性は0以上の数値である必要があります。');
      }
    }
  });
});