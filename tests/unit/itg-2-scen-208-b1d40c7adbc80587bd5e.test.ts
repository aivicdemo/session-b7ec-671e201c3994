import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, AnalysisResultData } from '../../src/logic/analysis-result-verification';
import * as analysisResultVerificationModule from '../../src/logic/analysis-result-verification';

describe('SCEN-208: 過去実績データが不足しているときInsufficientHistoricalDataエラーが発生する', () => {
  let validateInputDataSpy: jest.SpyInstance;
  let findProductivityDataByWorkerAndPeriodSpy: jest.SpyInstance;
  let findProductivityDataByTeamAndPeriodSpy: jest.SpyInstance;
  let findProductivityDataBySiteAndPeriodSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InsufficientHistoricalData error when worker historical data is insufficient', async () => {
    // Step 1: Prepare test input
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 85,
      averageQualityScore: 90,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: '現在のレベルを維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'analysis-001',
      workerId: 'worker-001',
      teamId: 'team-001',
      siteId: 'site-001',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'user-001',
    };

    // Step 3: Stub validateInputData to indicate input is valid
    validateInputDataSpy = jest.spyOn(analysisResultVerificationModule as any, 'validateInputData')
      .mockResolvedValue(true);

    // Step 4: Stub findProductivityDataByWorkerAndPeriod to return empty array
    // (worker historical data is 0 items for past 3 months)
    findProductivityDataByWorkerAndPeriodSpy = jest.spyOn(analysisResultVerificationModule as any, 'findProductivityDataByWorkerAndPeriod')
      .mockResolvedValue([]);

    // Step 5: Stub findProductivityDataByTeamAndPeriod to return team historical data
    findProductivityDataByTeamAndPeriodSpy = jest.spyOn(analysisResultVerificationModule as any, 'findProductivityDataByTeamAndPeriod')
      .mockResolvedValue([
        { productivityRate: 80, date: '2023-11-01' },
        { productivityRate: 82, date: '2023-12-01' },
        { productivityRate: 81, date: '2024-01-01' },
      ]);

    // Step 6: Stub findProductivityDataBySiteAndPeriod to return site historical data
    findProductivityDataBySiteAndPeriodSpy = jest.spyOn(analysisResultVerificationModule as any, 'findProductivityDataBySiteAndPeriod')
      .mockResolvedValue([
        { productivityRate: 78, date: '2023-11-01' },
        { productivityRate: 79, date: '2023-12-01' },
        { productivityRate: 80, date: '2024-01-01' },
      ]);

    // Step 7: Call verifyAndScoreAnalysisResult with the prepared input
    let thrownError: Error | null = null;
    let result: any = undefined;

    try {
      result = await verifyAndScoreAnalysisResult(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // Verify error was thrown
    expect(thrownError).not.toBeNull();
    expect(thrownError?.name).toBe('InsufficientHistoricalData');
    expect(thrownError?.message).toBe('過去実績データが不足しているため、妥当性検証を実行できません。');

    // Verify that VerifyAndScoreAnalysisResultOutput is not returned
    expect(result).toBeUndefined();

    // Verify that stubs were called with correct parameters
    expect(findProductivityDataByWorkerAndPeriodSpy).toHaveBeenCalledWith(
      'worker-001',
      '2024-01-01',
      '2024-01-31',
      3
    );
  });
});