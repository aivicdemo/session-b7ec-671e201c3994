import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput } from '../../src/agents/tx-2-imp-1/orchestrator';
import { AnalysisResultVerificationFailureException } from '../../src/agents/tx-2-imp-1/services/verification';

// Mock the dependencies
jest.mock('../../src/agents/tx-2-imp-1/services/aggregation', () => ({
  executeDailyBatchProcess: jest.fn(),
}));

jest.mock('../../src/agents/tx-2-imp-1/services/validation', () => ({
  validateAggregatedPerformanceData: jest.fn(),
}));

jest.mock('../../src/agents/tx-2-imp-1/services/verification', () => ({
  verifyAndScoreAnalysisResult: jest.fn(),
  AnalysisResultVerificationFailureException: class AnalysisResultVerificationFailureException extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AnalysisResultVerificationFailureException';
      Object.setPrototypeOf(this, AnalysisResultVerificationFailureException.prototype);
    }
  },
}));

jest.mock('../../src/agents/tx-2-imp-1/services/notification', () => ({
  sendQualityValidationResultToFieldLeader: jest.fn(),
  sendAnalysisResultVerificationToManager: jest.fn(),
}));

describe('SCEN-016: 分析結果の妥当性検証に失敗する場合', () => {
  let aggregationServiceMock: any;
  let validationServiceMock: any;
  let verificationServiceMock: any;
  let notificationServiceMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    aggregationServiceMock = require('../../src/agents/tx-2-imp-1/services/aggregation');
    validationServiceMock = require('../../src/agents/tx-2-imp-1/services/validation');
    verificationServiceMock = require('../../src/agents/tx-2-imp-1/services/verification');
    notificationServiceMock = require('../../src/agents/tx-2-imp-1/services/notification');
  });

  it('分析結果の検証に失敗した場合、AnalysisResultVerificationFailureExceptionが発生して伝播する', async () => {
    // Arrange
    const input: Tx2Imp1AgentInput = {
      triggerType: 'scheduled',
      targetDate: '2025-01-15',
      executorUserId: 'user-001',
    };

    // Create a mock AI client with the required structure
    const mockAiClient = {
      analyzeAggregatedData: jest.fn(),
      generateAnalysisReport: jest.fn(),
      verifyResults: jest.fn(),
    };

    // Setup mock for aggregation to return valid result
    aggregationServiceMock.executeDailyBatchProcess.mockResolvedValue({
      aggregatedRecordCount: 100,
      aggregationPeriod: '2025-01-15',
      completenessScore: 95,
    });

    // Setup mock for validation to return valid result
    validationServiceMock.validateAggregatedPerformanceData.mockResolvedValue({
      validationStatus: 'passed',
      anomalousRecords: [],
      improvementGuidance: [],
    });

    // Setup mock for verification to throw the designed exception
    const verificationException = new AnalysisResultVerificationFailureException(
      '分析結果の検証に失敗しました。異常値判定ができません。'
    );
    verificationServiceMock.verifyAndScoreAnalysisResult.mockRejectedValue(verificationException);

    // Act & Assert
    let caughtError: Error | null = null;
    try {
      await runTx2Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify that the exception was thrown with the correct message
    expect(caughtError).not.toBeNull();
    expect(caughtError).toBeInstanceOf(AnalysisResultVerificationFailureException);
    expect(caughtError?.message).toBe('分析結果の検証に失敗しました。異常値判定ができません。');

    // Verify that notification functions were NOT called
    expect(notificationServiceMock.sendQualityValidationResultToFieldLeader).not.toHaveBeenCalled();
    expect(notificationServiceMock.sendAnalysisResultVerificationToManager).not.toHaveBeenCalled();
  });
});