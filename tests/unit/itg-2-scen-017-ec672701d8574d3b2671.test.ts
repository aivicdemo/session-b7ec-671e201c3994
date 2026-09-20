import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

class DataQualityValidationFailureException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataQualityValidationFailureException';
  }
}

describe('SCEN-017: 集約データの品質検証に失敗した場合、DataQualityValidationFailureExceptionが発生する', () => {
  it('should throw DataQualityValidationFailureException and return failure status when data quality validation fails', async () => {
    // Arrange
    const input = {
      triggerType: 'scheduled' as const,
      targetDate: '2024-01-15',
      executorUserId: 'user-001',
    };

    const mockAiClient = {
      executeDailyBatchProcess: jest.fn().mockResolvedValue({
        aggregationResult: {
          aggregatedRecordCount: 100,
          aggregationPeriod: '2024-01-15',
          completenessScore: 95,
        },
      }),
      validateAggregatedPerformanceData: jest.fn().mockRejectedValue(
        new DataQualityValidationFailureException(
          'データ品質検証に失敗しました。異常値判定ができません。'
        )
      ),
      analyzeProductivityPatterns: jest.fn(),
      evaluateWorkerProficiency: jest.fn(),
      verifyAnalysisResults: jest.fn(),
      notifyStakeholders: jest.fn(),
      persistAnalysisData: jest.fn(),
    };

    // Act
    const result = await runTx2Imp1Agent(input, mockAiClient);

    // Assert
    expect(result.executionStatus).toBe('failure');
    expect(result.validationResult).toBeNull();
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails?.[0].errorMessage).toBe(
      'データ品質検証に失敗しました。異常値判定ができません。'
    );
    expect(result.errorDetails?.[0].failedStep).toBe('validateAggregatedPerformanceData');
    expect(result.errorDetails?.[0].errorCode).toBeDefined();
  });
});