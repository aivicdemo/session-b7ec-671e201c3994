import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, AnalysisResultData } from '../../src/logic/analysis-result-verification';

describe('SCEN-227: 入力値の形式と必須項目をvalidateInputDataで検証できる', () => {
  it('正常系入力値で検証が成功し、出力が正常に返される', async () => {
    // ステップ1-2: 正常系入力値を準備
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    // ステップ3: verifyAndScoreAnalysisResultを呼び出す
    const result = await verifyAndScoreAnalysisResult(input);

    // ステップ5: 返却されたレスポンスを検証
    expect(result).toBeDefined();
    expect(result.validityScore).toBeDefined();
    expect(typeof result.validityScore).toBe('number');
    expect(result.validityScore).toBeGreaterThanOrEqual(0);
    expect(result.validityScore).toBeLessThanOrEqual(100);

    expect(result.approvalRecommendation).toBeDefined();
    expect(['APPROVED', 'REQUIRES_REVIEW']).toContain(result.approvalRecommendation);

    expect(result.validityJudgmentReason).toBeDefined();
    expect(typeof result.validityJudgmentReason).toBe('string');
    expect(result.validityJudgmentReason.length).toBeGreaterThan(0);

    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);

    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.teamHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.siteHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.workerProductivityTrend).toBeDefined();

    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBeDefined();
    expect(result.industryStandardComparison.industryStandardQuality).toBeDefined();
    expect(result.industryStandardComparison.evaluationLevel).toBeDefined();

    expect(result.verificationTimestamp).toBeDefined();
    expect(typeof result.verificationTimestamp).toBe('string');
  });

  it('analysisResultIdが空文字列の場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: '',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('workerIdが空文字列の場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: '',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('teamIdが空文字列の場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: '',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('siteIdが空文字列の場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: '',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('analysisStartDateがISO 8601形式でない場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024/01/01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('analysisEndDateがISO 8601形式でない場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024/03/31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('comparisonPeriodMonthsが3未満の場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 2,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('executorUserIdが空文字列の場合、エラーが発生する', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: '',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('analysisResultDataが必須フィールドを欠いている場合、エラーが発生する', async () => {
    const analysisResultData: any = {
      averageProductivity: 85,
      averageQualityScore: 90,
      // proficiencyLevel が欠落
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData,
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });

  it('analysisResultDataが不正な型の場合、エラーが発生する', async () => {
    const input: any = {
      analysisResultId: 'AR-001',
      workerId: 'WK-123',
      teamId: 'TM-456',
      siteId: 'ST-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-999',
      analysisResultData: 'invalid',
    };

    await expect(verifyAndScoreAnalysisResult(input)).rejects.toThrow();
  });
});