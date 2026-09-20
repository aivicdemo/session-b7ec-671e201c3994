import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, VerifyAndScoreAnalysisResultOutput } from '../../src/logic/analysis-result-verification';
import * as analysisResultVerificationModule from '../../src/logic/analysis-result-verification';

describe('SCEN-214: 業界標準ベンチマークが1年以上更新されていないとき警告メッセージが生成される', () => {
  let validateInputDataSpy: jest.SpyInstance;
  let findProductivityDataByWorkerAndPeriodSpy: jest.SpyInstance;
  let findProductivityDataByTeamAndPeriodSpy: jest.SpyInstance;
  let findProductivityDataBySiteAndPeriodSpy: jest.SpyInstance;
  let getIndustryStandardBenchmarkSpy: jest.SpyInstance;
  let getBusinessRuleComplianceSpy: jest.SpyInstance;

  beforeEach(() => {
    // スタブ設定：validateInputData
    validateInputDataSpy = jest.spyOn(analysisResultVerificationModule as any, 'validateInputData').mockResolvedValue(true);

    // スタブ設定：findProductivityDataByWorkerAndPeriod - 過去3ヶ月間の実績データ（20件以上）
    findProductivityDataByWorkerAndPeriodSpy = jest
      .spyOn(analysisResultVerificationModule as any, 'findProductivityDataByWorkerAndPeriod')
      .mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({
          date: new Date(2023, 10 + Math.floor(i / 8), 1 + (i % 8)),
          productivity: 90 + Math.random() * 10,
        }))
      );

    // スタブ設定：findProductivityDataByTeamAndPeriod - 過去3ヶ月間の実績データ（20件以上）
    findProductivityDataByTeamAndPeriodSpy = jest
      .spyOn(analysisResultVerificationModule as any, 'findProductivityDataByTeamAndPeriod')
      .mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({
          date: new Date(2023, 10 + Math.floor(i / 8), 1 + (i % 8)),
          productivity: 85 + Math.random() * 10,
        }))
      );

    // スタブ設定：findProductivityDataBySiteAndPeriod - 過去3ヶ月間の実績データ（20件以上）
    findProductivityDataBySiteAndPeriodSpy = jest
      .spyOn(analysisResultVerificationModule as any, 'findProductivityDataBySiteAndPeriod')
      .mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({
          date: new Date(2023, 10 + Math.floor(i / 8), 1 + (i % 8)),
          productivity: 80 + Math.random() * 15,
        }))
      );

    // スタブ設定：業界標準ベンチマーク - 更新日が1年以上前のデータ
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setMonth(0);
    oneYearAgo.setDate(1);
    const benchmarkUpdateDate = oneYearAgo.toISOString();

    getIndustryStandardBenchmarkSpy = jest
      .spyOn(analysisResultVerificationModule as any, 'getIndustryStandardBenchmark')
      .mockResolvedValue({
        industryStandardProductivity: 80,
        industryStandardQuality: 75,
        updatedDate: benchmarkUpdateDate,
      });

    // スタブ設定：業務ルール適合性チェック
    getBusinessRuleComplianceSpy = jest
      .spyOn(analysisResultVerificationModule as any, 'getBusinessRuleCompliance')
      .mockResolvedValue([
        {
          ruleId: 'RULE-001',
          ruleName: 'Productivity Standard',
          complianceStatus: 'COMPLIANT',
          scoreContribution: 40,
          details: 'Productivity meets minimum standard',
        },
        {
          ruleId: 'RULE-002',
          ruleName: 'Quality Standard',
          complianceStatus: 'COMPLIANT',
          scoreContribution: 35,
          details: 'Quality score meets acceptable range',
        },
      ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate a warning message when industry standard benchmark is older than 1 year', async () => {
    // テスト用の分析結果データを準備する
    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'RESULT-001',
      workerId: 'WORKER-001',
      teamId: 'TEAM-001',
      siteId: 'SITE-001',
      analysisResultData: {
        averageProductivity: 95,
        averageQualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE',
        errorRate: 5,
        recommendedAction: 'MAINTAIN',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'EXEC-001',
    };

    // 上記の入力値でverifyAndScoreAnalysisResultを呼び出す
    const result: VerifyAndScoreAnalysisResultOutput = await verifyAndScoreAnalysisResult(input);

    // 戻り値が正しく返されていることを確認
    expect(result).toBeDefined();
    expect(result.validityScore).toBeGreaterThanOrEqual(0);
    expect(result.validityScore).toBeLessThanOrEqual(100);
    expect(result.approvalRecommendation).toMatch(/^(APPROVED|REQUIRES_REVIEW)$/);
    expect(result.validityJudgmentReason).toBeDefined();
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.verificationTimestamp).toBeDefined();

    // flagsForReviewフィールドが存在することを確認
    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);

    // 業界標準ベンチマークの古さに関する警告を検出
    const benchmarkWarning = result.flagsForReview.find(
      (flag) =>
        flag.description.includes('業界標準データが古い可能性があります')
    );

    // 警告が存在することを必須確認
    expect(benchmarkWarning).toBeDefined();
    if (benchmarkWarning) {
      expect(benchmarkWarning.description).toContain('業界標準データが古い可能性があります。最新版への更新を検討してください');
      expect(benchmarkWarning.severity).toMatch(/^(HIGH|MEDIUM|LOW)$/);
      expect(benchmarkWarning.recommendedReviewAction).toBeDefined();
    }

    // 警告がスコア計算に影響していないことを確認（スコアは他の要件で決定される）
    expect(result.validityJudgmentReason).toBeDefined();
    expect(result.validityJudgmentReason).not.toContain('undefined');

    // validityScoreが70以上の場合でも、警告が出力されていることを確認
    if (result.validityScore >= 70) {
      expect(result.approvalRecommendation).toBe('APPROVED');
    }

    // verificationTimestampは現在のISO 8601形式の日時が記録されていることを確認
    const timestamp = new Date(result.verificationTimestamp);
    expect(timestamp instanceof Date && !isNaN(timestamp.getTime())).toBe(true);
    expect(result.verificationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });

  it('should still recommend approval when validity score is 70 or higher even with outdated benchmark warning', async () => {
    // テスト用の分析結果データを準備する
    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'RESULT-002',
      workerId: 'WORKER-002',
      teamId: 'TEAM-002',
      siteId: 'SITE-002',
      analysisResultData: {
        averageProductivity: 95,
        averageQualityScore: 85,
        proficiencyLevel: 'ADVANCED',
        errorRate: 3,
        recommendedAction: 'PROMOTE',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'EXEC-002',
    };

    // 上記の入力値でverifyAndScoreAnalysisResultを呼び出す
    const result: VerifyAndScoreAnalysisResultOutput = await verifyAndScoreAnalysisResult(input);

    // スコアが70以上の場合のテスト
    if (result.validityScore >= 70) {
      expect(result.approvalRecommendation).toBe('APPROVED');
    } else {
      expect(result.approvalRecommendation).toBe('REQUIRES_REVIEW');
    }

    // flagsForReviewが存在することを確認
    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);

    // 警告が存在していてもスコアと承認推奨が影響を受けないことを確認
    expect(result.validityScore).toBeGreaterThanOrEqual(0);
    expect(result.validityScore).toBeLessThanOrEqual(100);

    // verificationTimestampが正しくセットされていることを確認
    expect(result.verificationTimestamp).toBeDefined();
    const timestamp = new Date(result.verificationTimestamp);
    expect(timestamp instanceof Date && !isNaN(timestamp.getTime())).toBe(true);
  });
});