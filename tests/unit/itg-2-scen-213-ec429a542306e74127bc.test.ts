import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import * as persistenceLayer from '../../src/logic/persistence-layer';
import * as authorizationValidation from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/persistence-layer');
jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-213: 過去3ヶ月間の実績データが10件未満のとき警告メッセージが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate warning message and flag when historical data is less than 10 records', async () => {
    const analysisResultId = 'analysis-001';
    const workerId = 'worker-001';
    const teamId = 'team-001';
    const siteId = 'site-001';
    const executorUserId = 'executor-001';
    const comparisonPeriodMonths = 3;
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-03-31';

    const analysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: 'Continue current assignment'
    };

    // Mock: 過去3ヶ月間の作業者個別の生産性データを9件返す（10件未満）
    const workerProductivityData = Array.from({ length: 9 }, (_, i) => ({
      workerId,
      date: new Date(2024, 0, 1 + i),
      productivityRate: 80 + Math.random() * 10,
      qualityScore: 88 + Math.random() * 5,
      errorCount: Math.floor(Math.random() * 3)
    }));

    (persistenceLayer.findProductivityDataByWorkerAndPeriod as jest.Mock).mockResolvedValue(
      workerProductivityData
    );

    // Mock: チーム平均の生産性データ
    const teamProductivityData = Array.from({ length: 12 }, (_, i) => ({
      teamId,
      date: new Date(2023, 10, 1 + i),
      productivityRate: 75 + Math.random() * 10,
      qualityScore: 85 + Math.random() * 5
    }));

    (persistenceLayer.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      teamProductivityData
    );

    // Mock: 拠点平均の生産性データ
    const siteProductivityData = Array.from({ length: 12 }, (_, i) => ({
      siteId,
      date: new Date(2023, 10, 1 + i),
      productivityRate: 70 + Math.random() * 10,
      qualityScore: 80 + Math.random() * 5
    }));

    (persistenceLayer.findProductivityDataBySiteAndPeriod as jest.Mock).mockResolvedValue(
      siteProductivityData
    );

    // Mock: 入力値が有効と判定
    (authorizationValidation.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: []
    });

    const result = await verifyAndScoreAnalysisResult({
      analysisResultId,
      workerId,
      teamId,
      siteId,
      analysisResultData,
      analysisStartDate,
      analysisEndDate,
      comparisonPeriodMonths,
      executorUserId
    });

    // 検証1: validityScore が計算されていること
    expect(result.validityScore).toBeDefined();
    expect(typeof result.validityScore).toBe('number');
    expect(result.validityScore).toBeGreaterThanOrEqual(0);
    expect(result.validityScore).toBeLessThanOrEqual(100);

    // 検証2: validityJudgmentReason に警告メッセージが含まれていること
    expect(result.validityJudgmentReason).toBeDefined();
    expect(result.validityJudgmentReason).toContain('過去実績が少ないため');
    expect(result.validityJudgmentReason).toContain('妥当性判定の信頼度が低い可能性があります');

    // 検証3: flagsForReview に過去実績データ不足に関する要確認フラグが存在すること
    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);
    const insufficientDataFlag = result.flagsForReview.find(
      flag => flag.flagType && flag.flagType.includes('データ不足')
    );
    expect(insufficientDataFlag).toBeDefined();
    expect(insufficientDataFlag?.severity).toMatch(/^(HIGH|MEDIUM|LOW)$/);
    expect(insufficientDataFlag?.description).toBeDefined();

    // 検証4: その他の出力フィールドが存在すること
    expect(result.approvalRecommendation).toMatch(/^(APPROVED|REQUIRES_REVIEW)$/);
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.verificationTimestamp).toBeDefined();

    // 検証5: エラーが発生していないことを確認
    expect(result).not.toHaveProperty('error');
  });
});