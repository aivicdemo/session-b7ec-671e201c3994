import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

describe('SCEN-181: Data validation error handling', () => {
  it('should throw SystemProcessingError when database connection fails during validation', async () => {
    // Prepare input values
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      siteId: undefined,
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: 'valid-token',
    };

    // Setup stubs for authentication and authorization (normal case)
    const authenticateUserSpy = jest.spyOn(dataQualityValidation as any, 'authenticateUser').mockResolvedValue({
      userId: 'LEADER-001',
      role: 'fieldLeader',
    });

    const authorizeUserActionSpy = jest.spyOn(dataQualityValidation as any, 'authorizeUserAction').mockResolvedValue(true);

    // Setup stubs for data retrieval to simulate database connection error
    const findProductivityDataSpy = jest.spyOn(dataQualityValidation as any, 'findProductivityDataByTeamAndPeriod').mockRejectedValue(
      new Error('DBConnection timeout: Unable to connect to database')
    );

    const findPerformanceRecordsSpy = jest.spyOn(dataQualityValidation as any, 'findPerformanceRecordsByWorkerIds').mockResolvedValue([]);

    // Setup stubs for validation subtasks (normal case)
    const assessCompletenessSpy = jest.spyOn(dataQualityValidation as any, 'assessDataCompleteness').mockResolvedValue({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 10,
      actualRecordCount: 10,
      completenessPercentage: 100,
      details: [],
    });

    const assessAccuracySpy = jest.spyOn(dataQualityValidation as any, 'assessDataAccuracy').mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    const detectAnomaliesSpy = jest.spyOn(dataQualityValidation as any, 'detectAnomalousValues').mockResolvedValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: '2024-01-31T23:59:59Z',
    });

    const generateJudgmentSpy = jest.spyOn(dataQualityValidation as any, 'generateQualityJudgment').mockResolvedValue({
      judgment: 'APPROVED',
      judgmentReason: 'All validations passed',
      qualityScore: 100,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 100,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    });

    const generateGuidanceSpy = jest.spyOn(dataQualityValidation as any, 'generateImprovementGuidance').mockResolvedValue({
      guidanceItems: [],
      generatedAt: '2024-01-31T23:59:59Z',
      totalGuidanceCount: 0,
      criticalActionCount: 0,
    });

    // Setup stub for notification (normal case)
    const sendNotificationSpy = jest.spyOn(dataQualityValidation as any, 'sendQualityValidationResultToFieldLeader').mockResolvedValue({
      sent: true,
      recipientUserId: 'LEADER-001',
      notificationTimestamp: '2024-01-31T23:59:59Z',
      deliveryStatus: 'DELIVERED',
    });

    // Call validateAggregatedPerformanceData and expect error
    let caughtError: any;
    try {
      await validateAggregatedPerformanceData(input);
    } catch (error) {
      caughtError = error;
    }

    // Verify SystemProcessingError was thrown
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('SystemProcessingError');
    expect(caughtError.message).toBe('検証処理中にシステムエラーが発生しました。管理者に報告してください。');

    // Verify error details contain database connection information
    expect(caughtError.stack || String(caughtError)).toMatch(/DBConnection|connection|timeout|refused/i);

    // Verify that validation subtasks were NOT called
    expect(assessCompletenessSpy).not.toHaveBeenCalled();
    expect(assessAccuracySpy).not.toHaveBeenCalled();
    expect(detectAnomaliesSpy).not.toHaveBeenCalled();
    expect(generateJudgmentSpy).not.toHaveBeenCalled();
    expect(generateGuidanceSpy).not.toHaveBeenCalled();

    // Verify that notification was NOT sent
    expect(sendNotificationSpy).not.toHaveBeenCalled();

    // Cleanup
    authenticateUserSpy.mockRestore();
    authorizeUserActionSpy.mockRestore();
    findProductivityDataSpy.mockRestore();
    findPerformanceRecordsSpy.mockRestore();
    assessCompletenessSpy.mockRestore();
    assessAccuracySpy.mockRestore();
    detectAnomaliesSpy.mockRestore();
    generateJudgmentSpy.mockRestore();
    generateGuidanceSpy.mockRestore();
    sendNotificationSpy.mockRestore();
  });
});