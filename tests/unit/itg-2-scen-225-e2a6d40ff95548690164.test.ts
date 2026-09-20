import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, AnalysisResultData } from '../../src/logic/analysis-result-verification';

describe('SCEN-225: 検証実行日時がISO 8601形式で記録される', () => {
  it('verificationTimestampがISO 8601形式で記録されること', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現在のレベル維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-20240115-001',
      workerId: 'W-12345',
      teamId: 'T-999',
      siteId: 'S-101',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-admin',
    };

    const result = await verifyAndScoreAnalysisResult(input);

    expect(result).toBeDefined();
    expect(result.verificationTimestamp).toBeDefined();

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([Z]|[+-]\d{2}:\d{2})$/;
    expect(result.verificationTimestamp).toMatch(iso8601Regex);

    const timestamp = new Date(result.verificationTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it('verificationTimestampが検証実行時刻を正確に表現していること', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 80,
      averageQualityScore: 88,
      proficiencyLevel: '上級',
      errorRate: 3,
      recommendedAction: '次レベルへの配置検討',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-20240115-002',
      workerId: 'W-54321',
      teamId: 'T-888',
      siteId: 'S-102',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executorUserId: 'U-admin',
    };

    const beforeCall = new Date();

    const result = await verifyAndScoreAnalysisResult(input);

    const afterCall = new Date();

    const resultTime = new Date(result.verificationTimestamp).getTime();
    const beforeTime = beforeCall.getTime();
    const afterTime = afterCall.getTime();

    expect(resultTime).toBeGreaterThanOrEqual(beforeTime - 1000);
    expect(resultTime).toBeLessThanOrEqual(afterTime + 1000);

    expect(result.verificationTimestamp).toMatch(/Z|[+-]\d{2}:\d{2}$/);
  });
});