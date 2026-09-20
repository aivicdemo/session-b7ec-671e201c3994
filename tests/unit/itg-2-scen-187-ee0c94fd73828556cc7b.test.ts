import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

// Mock authentication and authorization functions
jest.mock('../../src/services/auth-service', () => ({
  authenticateUser: jest.fn(),
  authorizeUserAction: jest.fn(),
}));

// Mock data access functions
jest.mock('../../src/services/data-service', () => ({
  findProductivityDataByTeamAndPeriod: jest.fn(),
}));

// Mock validation functions
jest.mock('../../src/services/validation-service', () => ({
  assessDataCompleteness: jest.fn(),
  assessDataAccuracy: jest.fn(),
  detectAnomalousValues: jest.fn(),
}));

// Mock judgment and guidance functions
jest.mock('../../src/services/quality-service', () => ({
  generateQualityJudgment: jest.fn(),
  generateImprovementGuidance: jest.fn(),
}));

// Mock notification function
jest.mock('../../src/services/notification-service', () => ({
  sendQualityValidationResultToFieldLeader: jest.fn(),
}));

import { authenticateUser, authorizeUserAction } from '../../src/services/auth-service';
import { findProductivityDataByTeamAndPeriod } from '../../src/services/data-service';
import {
  assessDataCompleteness,
  assessDataAccuracy,
  detectAnomalousValues,
} from '../../src/services/validation-service';
import {
  generateQualityJudgment,
  generateImprovementGuidance,
} from '../../src/services/quality-service';
import { sendQualityValidationResultToFieldLeader } from '../../src/services/notification-service';

describe('SCEN-187: 代表的な正常なデータセットに対して、データ収集カバー率の計算と異常値検出ルール照合により正確な品質スコアが算出される', () => {
  const mockAuthenticateUser = authenticateUser as jest.Mock;
  const mockAuthorizeUserAction = authorizeUserAction as jest.Mock;
  const mockFindProductivityData = findProductivityDataByTeamAndPeriod as jest.Mock;
  const mockAssessCompleteness = assessDataCompleteness as jest.Mock;
  const mockAssessAccuracy = assessDataAccuracy as jest.Mock;
  const mockDetectAnomalies = detectAnomalousValues as jest.Mock;
  const mockGenerateJudgment = generateQualityJudgment as jest.Mock;
  const mockGenerateGuidance = generateImprovementGuidance as jest.Mock;
  const mockSendNotification = sendQualityValidationResultToFieldLeader as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate accurate quality score for normal dataset with proper completeness assessment, accuracy validation, and anomaly detection', async () => {
    // Step 1: Setup authentication stub
    mockAuthenticateUser.mockResolvedValue({ userId: 'LEADER001', isAuthenticated: true });

    // Step 2: Setup authorization stub
    mockAuthorizeUserAction.mockResolvedValue({ isAuthorized: true });

    // Step 3: Setup data retrieval with normal dataset
    const mockProductivityData = Array.from({ length: 10 }, (_, i) => ({
      productivityDataId: `DATA_${String(i + 1).padStart(3, '0')}`,
      workerId: `WORKER_${String(i + 1).padStart(3, '0')}`,
      plannedWorkingHours: 8,
      actualWorkingHours: 7.9 + Math.random() * 0.1,
      completedCount: 50 + Math.floor(Math.random() * 50),
      productivityRate: 95 + Math.random() * 4,
      qualityScore: 98 + Math.random() * 2,
      errorCount: Math.floor(Math.random() * 1),
      proficiencyLevel: 'LEVEL_3',
    }));

    mockFindProductivityData.mockResolvedValue(mockProductivityData);

    // Step 5: Setup completeness assessment
    mockAssessCompleteness.mockResolvedValue({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 50,
      actualRecordCount: 49,
      completenessPercentage: 98,
      details: [],
    });

    // Step 6: Setup accuracy assessment
    mockAssessAccuracy.mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    // Step 7: Setup anomaly detection
    mockDetectAnomalies.mockResolvedValue({
      status: 'PASS',
      anomalousRecordCount: 0,
      anomalies: [],
      detectionExecutedAt: new Date().toISOString(),
    });

    // Step 8: Setup quality judgment
    mockGenerateJudgment.mockResolvedValue({
      judgment: 'APPROVED',
      judgmentReason: '品質スコアが正常範囲内であり承認可能',
      qualityScore: 94,
      approvalEligibility: true,
      componentScores: {
        completenessScore: 98,
        accuracyScore: 100,
        anomalyScore: 100,
      },
    });

    // Step 9: Setup improvement guidance
    mockGenerateGuidance.mockResolvedValue([]);

    // Step 10: Setup notification
    mockSendNotification.mockResolvedValue({
      sent: true,
      recipientUserId: 'LEADER001',
      notificationTimestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
    });

    // Step 4: Call the target function
    const result = await validateAggregatedPerformanceData({
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-07',
      teamId: 'TEAM001',
      fieldLeaderUserId: 'LEADER001',
      userAuthToken: 'valid_token_xyz',
    });

    // Step 11: Verify all output fields
    expect(result.validationExecutedAt).toBeDefined();
    expect(typeof result.validationExecutedAt).toBe('string');

    expect(result.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-07');

    expect(result.targetTeamId).toBe('TEAM001');
    expect(result.totalRecordsProcessed).toBe(49);

    // Completeness assessment validation
    expect(result.completenessAssessment.status).toBe('PASS');
    expect(result.completenessAssessment.missingFieldCount).toBe(0);
    expect(result.completenessAssessment.expectedRecordCount).toBe(50);
    expect(result.completenessAssessment.actualRecordCount).toBe(49);
    expect(result.completenessAssessment.completenessPercentage).toBe(98);
    expect(result.completenessAssessment.details).toEqual([]);

    // Accuracy assessment validation
    expect(result.accuracyAssessment.status).toBe('PASS');
    expect(result.accuracyAssessment.inconsistencyCount).toBe(0);
    expect(result.accuracyAssessment.outOfRangeCount).toBe(0);
    expect(result.accuracyAssessment.details).toEqual([]);

    // Anomaly detection validation
    expect(result.anomalyDetection.status).toBe('PASS');
    expect(result.anomalyDetection.anomalousRecordCount).toBe(0);
    expect(result.anomalyDetection.anomalies).toEqual([]);

    // Overall quality judgment validation
    expect(result.overallQualityJudgment.judgment).toBe('APPROVED');
    expect(result.overallQualityJudgment.judgmentReason).toBe(
      '品質スコアが正常範囲内であり承認可能'
    );
    expect(result.overallQualityJudgment.qualityScore).toBe(94);
    expect(result.overallQualityJudgment.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.overallQualityJudgment.qualityScore).toBeLessThanOrEqual(100);
    expect(result.overallQualityJudgment.approvalEligibility).toBe(true);

    // Improvement guidance validation
    expect(result.improvementGuidance).toEqual([]);

    // Notification validation
    expect(result.notificationSent.sent).toBe(true);
    expect(result.notificationSent.recipientUserId).toBe('LEADER001');
    expect(result.notificationSent.notificationTimestamp).toBeDefined();
    expect(result.notificationSent.deliveryStatus).toBe('DELIVERED');

    // Verify call sequence
    expect(mockAuthenticateUser).toHaveBeenCalled();
    expect(mockAuthorizeUserAction).toHaveBeenCalled();
    expect(mockFindProductivityData).toHaveBeenCalled();
    expect(mockAssessCompleteness).toHaveBeenCalled();
    expect(mockAssessAccuracy).toHaveBeenCalled();
    expect(mockDetectAnomalies).toHaveBeenCalled();
    expect(mockGenerateJudgment).toHaveBeenCalled();
    expect(mockGenerateGuidance).toHaveBeenCalled();
    expect(mockSendNotification).toHaveBeenCalled();
  });
});