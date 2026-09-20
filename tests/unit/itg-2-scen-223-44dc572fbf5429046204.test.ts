import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, VerifyAndScoreAnalysisResultOutput } from '../../src/logic/analysis-result-verification';
import * as analysisModule from '../../src/logic/analysis-result-verification';

describe('SCEN-223: センター固有ルール適合時にはスコア計算で100点が適用される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('センター固有ルール適合時に妥当性スコア100を返す', async () => {
    // 入力値を準備
    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'W-001',
      teamId: 'T-001',
      siteId: 'S-001',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USER-001',
      analysisResultData: {
        averageProductivity: 100,
        averageQualityScore: 95,
        proficiencyLevel: '3',
        errorRate: 3,
        recommendedAction: '配置継続'
      }
    };

    // スタブ validateInputData を成功で返すよう設定する
    jest.spyOn(analysisModule, 'validateInputData' as any).mockResolvedValue(true);

    // スタブ findProductivityDataByWorkerAndPeriod を設定する：過去3ヶ月間の同一作業者の実績データ12件を返す
    const workerProductivityData = Array.from({ length: 12 }, (_, i) => ({
      productivityDataId: `PD-W-${i}`,
      workerId: 'W-001',
      productivityRate: 100,
      qualityScore: 95,
      errorRate: 3,
      workDate: new Date(2023, 10 + Math.floor(i / 4), (i % 4) + 1).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    jest.spyOn(analysisModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue(workerProductivityData);

    // スタブ findProductivityDataByTeamAndPeriod を設定する：過去3ヶ月間の同一チームの実績データを返す
    const teamProductivityData = Array.from({ length: 12 }, (_, i) => ({
      productivityDataId: `PD-T-${i}`,
      teamId: 'T-001',
      productivityRate: 100,
      qualityScore: 94,
      errorRate: 3.5,
      workDate: new Date(2023, 10 + Math.floor(i / 4), (i % 4) + 1).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    jest.spyOn(analysisModule, 'findProductivityDataByTeamAndPeriod' as any).mockResolvedValue(teamProductivityData);

    // スタブ findProductivityDataBySiteAndPeriod を設定する：過去3ヶ月間の同一拠点の実績データを返す
    const siteProductivityData = Array.from({ length: 12 }, (_, i) => ({
      productivityDataId: `PD-S-${i}`,
      siteId: 'S-001',
      productivityRate: 98,
      qualityScore: 93,
      errorRate: 4,
      workDate: new Date(2023, 10 + Math.floor(i / 4), (i % 4) + 1).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    jest.spyOn(analysisModule, 'findProductivityDataBySiteAndPeriod' as any).mockResolvedValue(siteProductivityData);

    // 当該物流センター固有ルール（centerSpecificRules）を準備する
    const centerSpecificRules = {
      ruleId: 'RULE-001',
      siteName: 'S-001',
      prohibitedPatterns: [],
      priorityConstraints: [],
      specialConstraints: [],
      rulesVersion: '1.0',
      effectiveDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    jest.spyOn(analysisModule, 'getCenterSpecificRules' as any).mockResolvedValue(centerSpecificRules);

    // 業界標準ベンチマーク（industryStandardComparison）を準備する
    const industryStandardBenchmark = {
      benchmarkId: 'BENCH-001',
      industryType: 'logistics',
      expectedProductivityValue: 100,
      expectedQualityValue: 90,
      errorRateStandard: 3,
      benchmarkVersion: '2024-01',
      lastUpdatedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    jest.spyOn(analysisModule, 'getIndustryStandardBenchmark' as any).mockResolvedValue(industryStandardBenchmark);

    // 操作を呼び出す
    const result: VerifyAndScoreAnalysisResultOutput = await verifyAndScoreAnalysisResult(input);

    // validityScore が 100 であることを確認
    expect(result.validityScore).toBe(100);

    // approvalRecommendation が 'APPROVED' であることを確認
    expect(result.approvalRecommendation).toBe('APPROVED');

    // businessRuleComplianceDetails を確認：すべてのルール照合結果で適合=true
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBeGreaterThan(0);
    
    // 各ルール適合結果を確認
    result.businessRuleComplianceDetails.forEach(detail => {
      expect(detail.complianceStatus).toBe('COMPLIANT');
      expect(detail.scoreContribution).toBe(100);
    });

    // validityJudgmentReason を確認
    expect(result.validityJudgmentReason).toBeDefined();
    expect(typeof result.validityJudgmentReason).toBe('string');
    expect(result.validityJudgmentReason).toContain('過去実績との乖離度');
    expect(result.validityJudgmentReason).toContain('業界標準との乖離度');
    expect(result.validityJudgmentReason).toContain('センター固有ルール適合');
    expect(result.validityJudgmentReason).toContain('100');

    // flagsForReview が空配列であることを確認
    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);
    expect(result.flagsForReview.length).toBe(0);

    // verificationTimestamp が ISO 8601 形式であることを確認
    expect(result.verificationTimestamp).toBeDefined();
    expect(typeof result.verificationTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.verificationTimestamp)).toBe(true);

    // historicalPerformanceComparison が含まれることを確認
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBe(100);

    // industryStandardComparison が含まれることを確認
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBe(100);
    expect(result.industryStandardComparison.evaluationLevel).toBe('EXCELLENT');
  });
});