import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import * as persistenceLayer from '../../src/logic/persistence-layer';
import * as authorizationValidation from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/persistence-layer');
jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-221: 業界標準との乖離度が±15%以内のとき高いスコア寄与度を得る', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('業界標準との乖離度が±15%以内のとき、validityScoreが100となり、approvalRecommendationが\\'APPROVED\\'になること', async () => {
    const testInput = {
      analysisResultId: 'AR-001',
      workerId: 'W001',
      teamId: 'T001',
      siteId: 'S001',
      analysisResultData: {
        averageProductivity: 100,
        averageQualityScore: 95,
        proficiencyLevel: '3',
        errorRate: 5,
        recommendedAction: 'Continue current assignment',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U001',
    };

    (persistenceLayer.findProductivityDataByWorkerAndPeriod as jest.Mock).mockResolvedValue({
      averageProductivity: 98,
      dataPoints: 10,
    });

    (persistenceLayer.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue({
      averageProductivity: 99,
      dataPoints: 45,
    });

    (persistenceLayer.findProductivityDataBySiteAndPeriod as jest.Mock).mockResolvedValue({
      averageProductivity: 99,
      dataPoints: 150,
    });

    (authorizationValidation.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
    });

    const result = await verifyAndScoreAnalysisResult(testInput);

    expect(result).toBeDefined();
    expect(result.validityScore).toBe(100);
    expect(result.approvalRecommendation).toBe('APPROVED');
    
    // 判定理由が具体的な数値と条件を含む完全な説明になっていることを検証
    expect(result.validityJudgmentReason).toMatch(/過去実績との乖離度.*?2\.04%.*?20%以内/);
    expect(result.validityJudgmentReason).toMatch(/業界標準との乖離度.*?1\.96%.*?15%以内/);
    expect(result.validityJudgmentReason).toMatch(/高いスコア寄与度/);

    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBeGreaterThan(0);

    // 複数のルール詳細が含まれることを確認
    const ruleDetails = result.businessRuleComplianceDetails.find(
      (detail) => detail.ruleId === 'br-tx_2-003'
    );
    expect(ruleDetails).toBeDefined();
    if (ruleDetails) {
      expect(ruleDetails.complianceStatus).toBe('COMPLIANT');
      expect(ruleDetails.scoreContribution).toBe(100);
    }

    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBe(102);
    expect(result.industryStandardComparison.productivityVsStandard).toBe(-2);
    // 乖離度1.96%と評価レベル優秀を含むことを検証
    expect(result.industryStandardComparison.evaluationLevel).toBe('EXCELLENT');

    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBe(98);
    // 現在値100 > 過去平均98でトレンド判定
    expect(result.historicalPerformanceComparison.workerProductivityTrend).toBe('IMPROVING');
    expect(result.historicalPerformanceComparison.teamHistoricalAverage).toBe(99);
    expect(result.historicalPerformanceComparison.siteHistoricalAverage).toBe(99);
    expect(result.historicalPerformanceComparison.workerVsTeamDifference).toBe(1);
    expect(result.historicalPerformanceComparison.workerVsSiteDifference).toBe(1);

    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);
    expect(result.flagsForReview?.length).toBe(0);

    expect(result.verificationTimestamp).toBeDefined();
    const timestamp = new Date(result.verificationTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(result.verificationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});