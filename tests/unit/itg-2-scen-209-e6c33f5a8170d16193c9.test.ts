import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';

describe('SCEN-209: 分析結果のデータ構造が不正なときInvalidAnalysisResultStructureエラーが発生する', () => {
  it('analysisResultDataから必須フィールドが欠落している場合、InvalidAnalysisResultStructureエラーが発生する', async () => {
    const invalidInput = {
      analysisResultId: 'result-123',
      workerId: 'worker-456',
      teamId: 'team-789',
      siteId: 'site-001',
      analysisResultData: {
        averageProductivity: 85,
        averageQualityScore: 90,
        proficiencyLevel: '上級',
        errorRate: 5,
        // recommendedActionが欠落
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executorUserId: 'user-exec-001',
    };

    await expect(
      verifyAndScoreAnalysisResult(invalidInput as any)
    ).rejects.toMatchObject({
      name: 'InvalidAnalysisResultStructure',
      message: expect.stringContaining('分析結果の構造が不正です。必須フィールドを確認してください。'),
    });
  });

  it('analysisResultDataの必須フィールドがnullの場合、InvalidAnalysisResultStructureエラーが発生する', async () => {
    const invalidInput = {
      analysisResultId: 'result-123',
      workerId: 'worker-456',
      teamId: 'team-789',
      siteId: 'site-001',
      analysisResultData: {
        averageProductivity: null,
        averageQualityScore: 90,
        proficiencyLevel: '上級',
        errorRate: 5,
        recommendedAction: 'スキル研修を推奨',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executorUserId: 'user-exec-001',
    };

    await expect(
      verifyAndScoreAnalysisResult(invalidInput as any)
    ).rejects.toMatchObject({
      name: 'InvalidAnalysisResultStructure',
      message: expect.stringContaining('分析結果の構造が不正です。必須フィールドを確認してください。'),
    });
  });

  it('analysisResultDataから複数の必須フィールドが欠落している場合、InvalidAnalysisResultStructureエラーが発生する', async () => {
    const invalidInput = {
      analysisResultId: 'result-123',
      workerId: 'worker-456',
      teamId: 'team-789',
      siteId: 'site-001',
      analysisResultData: {
        averageProductivity: 85,
        // averageQualityScoreが欠落
        // proficiencyLevelが欠落
        errorRate: 5,
        recommendedAction: 'スキル研修を推奨',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executorUserId: 'user-exec-001',
    };

    await expect(
      verifyAndScoreAnalysisResult(invalidInput as any)
    ).rejects.toMatchObject({
      name: 'InvalidAnalysisResultStructure',
      message: expect.stringContaining('分析結果の構造が不正です。必須フィールドを確認してください。'),
    });
  });
});