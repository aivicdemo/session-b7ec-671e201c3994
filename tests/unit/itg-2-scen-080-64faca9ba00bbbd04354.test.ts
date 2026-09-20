import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';

// Mock modules at the top level before the test suite
jest.mock('../../src/services/performance-data-aggregation');
jest.mock('../../src/services/data-retrieval-handler');
jest.mock('../../src/services/notification-service');

describe('SCEN-080: 習熟度監視期間中のデータ取得タイムアウト時キャッシュ使用', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('WES・ハンディターミナルからのデータ取得がタイムアウトした場合、キャッシュデータを使用して処理を継続する', async () => {
    const newAssigneeId = 'assignee-001';
    const aptitudeTestResult = {
      totalScore: 82,
      strongFields: ['assembly', 'quality_check'],
      recommendedDuties: ['basic_assembly'],
    };
    const assignmentStartDate = '2024-01-01T00:00:00Z';
    const monitoringDurationDays = 30;
    const proficiencyThreshold = 75;

    const input = {
      newAssigneeId,
      aptitudeTestResult,
      assignmentStartDate,
      monitoringDurationDays,
      proficiencyThreshold,
      triggeredBy: 'scheduled_monitoring' as const,
    };

    // Mock AI client for the orchestrator
    const mockAiClient = {
      analyzeInitialAssignmentRecommendation: jest.fn(),
      monitorProficiencyProgress: jest.fn(),
      evaluateDifficultyAdjustment: jest.fn(),
      notifyManagement: jest.fn(),
    };

    // Import mocked modules
    const aggregationModule = require('../../src/services/performance-data-aggregation');
    const retrievalModule = require('../../src/services/data-retrieval-handler');
    const notificationModule = require('../../src/services/notification-service');

    // Create custom error with code property
    class PerformanceDataCollectionTimeoutError extends Error {
      code = 'PerformanceDataCollectionTimeoutError';
      message = '実績データの収集がタイムアウトしました。キャッシュデータを使用して処理を継続します。';

      constructor() {
        super('PerformanceDataCollectionTimeoutError: 実績データの収集がタイムアウトしました。キャッシュデータを使用して処理を継続します。');
        Object.setPrototypeOf(this, PerformanceDataCollectionTimeoutError.prototype);
      }
    }

    // Stub aggregatePerformanceDataByPeriod to throw timeout error with code property
    aggregationModule.aggregatePerformanceDataByPeriod = jest
      .fn()
      .mockRejectedValue(new PerformanceDataCollectionTimeoutError());

    // Stub handleDataRetrievalFailureAndGeneratePlacement to use cached data
    const mockCachedMonitoringStatus = {
      currentProficiencyLevel: 68,
      proficiencyTrendPercentage: 12,
      daysIntoMonitoring: 15,
      projectedThresholdReachDate: null,
      recentPerformanceMetrics: [
        {
          date: '2024-01-15T00:00:00Z',
          productivityRate: 65,
          qualityScore: 78,
          completedQuantity: 120,
        },
      ],
    };

    retrievalModule.handleDataRetrievalFailureAndGeneratePlacement = jest
      .fn()
      .mockResolvedValue(mockCachedMonitoringStatus);

    // Stub sendOnboardingAnalysisResultToManager
    notificationModule.sendOnboardingAnalysisResultToManager = jest
      .fn()
      .mockResolvedValue(true);

    const result = await runTx5Imp2Agent(input, mockAiClient);

    // Verify phase
    expect(result.phase).toBe('monitoring_in_progress');

    // Verify monitoringStatus contains cache data
    expect(result.monitoringStatus).not.toBeNull();
    expect(result.monitoringStatus?.currentProficiencyLevel).toBe(68);
    expect(result.monitoringStatus?.proficiencyTrendPercentage).toBe(12);
    expect(result.monitoringStatus?.daysIntoMonitoring).toBe(15);
    expect(result.monitoringStatus?.projectedThresholdReachDate).toBeNull();
    expect(result.monitoringStatus?.recentPerformanceMetrics).toHaveLength(1);
    expect(result.monitoringStatus?.recentPerformanceMetrics[0].productivityRate).toBe(
      65
    );

    // Verify handleDataRetrievalFailureAndGeneratePlacement was called with appropriate parameters
    expect(
      retrievalModule.handleDataRetrievalFailureAndGeneratePlacement
    ).toHaveBeenCalled();
    const callArgs = retrievalModule.handleDataRetrievalFailureAndGeneratePlacement.mock.calls[0];
    expect(callArgs).toBeDefined();

    // Verify errors array contains exactly one timeout error with correct structure
    expect(result.errors).toBeDefined();
    expect(result.errors).toHaveLength(1);
    const timeoutError = result.errors![0];
    expect(timeoutError.code).toBe('PerformanceDataCollectionTimeoutError');
    expect(timeoutError.message).toBe(
      '実績データの収集がタイムアウトしました。キャッシュデータを使用して処理を継続します。'
    );

    // Verify notification was sent with monitoring status information
    expect(result.notificationSent).toBe(true);
    expect(
      notificationModule.sendOnboardingAnalysisResultToManager
    ).toHaveBeenCalled();
    const notificationCallArgs = notificationModule.sendOnboardingAnalysisResultToManager.mock.calls[0];
    expect(notificationCallArgs).toBeDefined();
    expect(notificationCallArgs[0]).toMatchObject({
      currentProficiencyLevel: 68,
      daysIntoMonitoring: 15,
    });

    // Verify executionTimestamp is ISO 8601 format
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );

    // Verify difficulty adjustment recommendation is null (proficiency not at threshold)
    expect(result.difficultyAdjustmentRecommendation).toBeNull();
  });
});