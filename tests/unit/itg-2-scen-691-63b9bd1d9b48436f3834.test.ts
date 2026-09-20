import { findComparisonAnalysisResultByName } from '../../src/logic/persistence-layer';

describe('作業者生産性データ分析・配置最適化支援システム', () => {
  describe('SCEN-691: 分析名が空文字列の場合、InvalidAnalysisName エラーが発生する', () => {
    it('分析名が空文字列の場合、InvalidAnalysisName エラーが発生し、エラー文言「分析名は必須項目です。」が返される', async () => {
      const analysisName = '';
      const requestingUserId = 'user-001';

      await expect(
        findComparisonAnalysisResultByName({
          analysisName,
          requestingUserId,
        })
      ).rejects.toThrow();

      try {
        await findComparisonAnalysisResultByName({
          analysisName,
          requestingUserId,
        });
      } catch (error: unknown) {
        const err = error as { name?: string; message?: string };
        expect(err.name).toBe('InvalidAnalysisName');
        expect(err.message).toBe('分析名は必須項目です。');
      }
    });
  });
});