import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import * as persistenceLayer from '../../src/logic/persistence-layer';
import * as authorizationValidation from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/persistence-layer');
jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-210: verifyAndScoreAnalysisResult - DataRetrievalFailure error when data retrieval fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalFailure error when worker productivity data retrieval fails', async () => {
    const input = {
      analysisResultId: 'AR-001',
      workerId: 'W-123',
      teamId: 'T-456',
      siteId: 'S-789',
      analysisResultData: {
        averageProductivity: 95,
        averageQualityScore: 92,
        proficiencyLevel: '3',
        errorRate: 8,
        recommendedAction: '現職配置継続',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-admin',
    };

    // Mock validateInputData to return success
    (authorizationValidation.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    // Mock findProductivityDataByWorkerAndPeriod to throw error
    const retrievalError = new Error('ネットワークエラー');
    (persistenceLayer.findProductivityDataByWorkerAndPeriod as jest.Mock).mockRejectedValue(
      retrievalError
    );

    // Mock findProductivityDataByTeamAndPeriod to return success
    (persistenceLayer.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue({
      averageProductivity: 85,
      dataPoints: 90,
    });

    // Mock findProductivityDataBySiteAndPeriod to return success
    (persistenceLayer.findProductivityDataBySiteAndPeriod as jest.Mock).mockResolvedValue({
      averageProductivity: 80,
      dataPoints: 150,
    });

    // Call the target operation and await the Promise
    await expect(verifyAndScoreAnalysisResult(input)).rejects.toMatchObject({
      name: 'DataRetrievalFailure',
      message: expect.stringContaining('照合に必要なデータの取得に失敗しました'),
    });
  });
});