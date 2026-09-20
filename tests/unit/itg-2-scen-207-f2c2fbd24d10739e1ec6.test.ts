import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput } from '../../src/logic/analysis-result-verification';

describe('SCEN-207: AnalysisResultNotFound error when analysis result ID does not exist', () => {
  it('should throw AnalysisResultNotFound error when analysisResultId does not exist', async () => {
    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'non-existent-analysis-result-id-12345',
      workerId: 'worker-123',
      teamId: 'team-456',
      siteId: 'site-789',
      analysisResultData: {
        averageProductivity: 85,
        averageQualityScore: 90,
        proficiencyLevel: '中級',
        errorRate: 5,
        recommendedAction: 'スキル向上研修を実施する',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executorUserId: 'executor-user-001',
    };

    try {
      await verifyAndScoreAnalysisResult(input);
      fail('Expected AnalysisResultNotFound error to be thrown');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      expect((error as any).name).toBe('AnalysisResultNotFound');
      expect((error as any).message).toBe('分析結果が見つかりません。分析結果IDを確認してください。');
    }
  });
});