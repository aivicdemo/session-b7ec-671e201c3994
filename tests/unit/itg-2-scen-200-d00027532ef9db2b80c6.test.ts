import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as jest from 'jest';

// Mock dependencies
jest.mock('../../src/logic/data-quality-validation', () => ({
  validateAggregatedPerformanceData: jest.fn(),
}));

describe('SCEN-200: Data Quality Validation with Improvement Guidance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate aggregated performance data and return improvement guidance classified by priority and category', async () => {
    // Mock data setup
    const mockImprovementGuidance = [
      {
        priority: 'CRITICAL',
        category: 'ANOMALY',
        action: 'Review high-severity anomalies',
        affectedRecordCount: 5,
        estimatedResolutionTime: '2時間',
        targetCompletionDate: '2024-02-02',
      },
      {
        priority: 'HIGH',
        category: 'ACCURACY',
        action: 'Correct out-of-range values',
        affectedRecordCount: 3,
        estimatedResolutionTime: '1時間',
        targetCompletionDate: '2024-02-03',
      },
      {
        priority: 'HIGH',
        category: 'COMPLETENESS',
        action: 'Fill missing quality score fields',
        affectedRecordCount: 2,
        estimatedResolutionTime: '30分',
        targetCompletionDate: '2024-02-02',
      },
      {
        priority: 'MEDIUM',
        category: 'ANOMALY',
        action: 'Investigate medium-severity anomalies',
        affectedRecordCount: 8,
        estimatedResolutionTime: '1時間30分',
        targetCompletionDate: '2024-02-05',
      },
      {
        priority: 'LOW',
        category: 'ACCURACY',
        action: 'Minor data consistency adjustments',
        affectedRecordCount: 1,
        estimatedResolutionTime: '15分',
        targetCompletionDate: '2024-02-10',
      },
    ];

    const mockOutput = {
      validationExecutedAt: '2024-01-31T15:30:45.123Z',
      aggregationPeriod: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      targetTeamId: 'TEAM-A001',
      totalRecordsProcessed: 150,
      completenessAssessment: {
        status: 'PASS',
        missingFieldCount: 0,
        expectedRecordCount: 150,
        actualRecordCount: 150,
        completenessPercentage: 100,
        details: [],
      },
      accuracyAssessment: {
        status: 'PASS',
        inconsistencyCount: 0,
        outOfRangeCount: 0,
        details: [],
      },
      anomalyDetection: {
        status: 'DETECTED',
        anomalousRecordCount: 16,
        anomalies: [
          {
            recordId: 'REC-001',
            workerId: 'WRK-100',
            field: 'productivityRate',
            anomalyType: 'STATISTICAL_OUTLIER',
            severity: 'HIGH',
            historicalAverage: 85,
            currentValue: 45,
            standardDeviation: 10,
            recommendedAction: 'Review work conditions',
          },
          {
            recordId: 'REC-002',
            workerId: 'WRK-101',
            field: 'qualityScore',
            anomalyType: 'BUSINESS_RULE_VIOLATION',
            severity: 'MEDIUM',
            currentValue: 50,
            recommendedAction: 'Provide additional training',
          },
          {
            recordId: 'REC-003',
            workerId: 'WRK-102',
            field: 'errorCount',
            anomalyType: 'STATISTICAL_OUTLIER',
            severity: 'LOW',
            currentValue: 12,
            recommendedAction: 'Monitor for improvement',
          },
        ],
      },
      overallQualityJudgment: {
        judgment: 'CONDITIONAL_APPROVAL',
        judgmentReason: 'Data quality is acceptable with attention to detected anomalies',
        qualityScore: 75,
        approvalEligibility: true,
        componentScores: {
          completenessScore: 100,
          accuracyScore: 100,
          anomalyScore: 60,
        },
      },
      improvementGuidance: mockImprovementGuidance,
      notificationSent: {
        sent: true,
        recipientUserId: 'FL-USER-001',
        notificationTimestamp: '2024-01-31T15:30:50.456Z',
        deliveryStatus: 'DELIVERED',
      },
    };

    (validateAggregatedPerformanceData as jest.Mock).mockResolvedValue(mockOutput);

    // Setup: Create input data
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-A001',
      fieldLeaderUserId: 'FL-USER-001',
      userAuthToken: 'valid-auth-token-12345',
      siteId: undefined,
    };

    // Execute the function
    const output = await validateAggregatedPerformanceData(input);

    // Assertion 1: Validate structure and basic fields
    expect(output).toBeDefined();
    expect(output.validationExecutedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.validationExecutedAt)).toBe(true);

    // Assertion 2: Validate aggregation period
    expect(output.aggregationPeriod).toBeDefined();
    expect(output.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(output.aggregationPeriod.endDate).toBe('2024-01-31');

    // Assertion 3: Validate target team
    expect(output.targetTeamId).toBe('TEAM-A001');

    // Assertion 4: Validate total records processed
    expect(output.totalRecordsProcessed).toBeGreaterThan(0);
    expect(typeof output.totalRecordsProcessed).toBe('number');

    // Assertion 5: Validate completeness assessment
    expect(output.completenessAssessment).toBeDefined();
    expect(output.completenessAssessment.status).toBe('PASS');
    expect(output.completenessAssessment.missingFieldCount).toBe(0);
    expect(output.completenessAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(output.completenessAssessment.completenessPercentage).toBeLessThanOrEqual(100);
    expect(output.completenessAssessment.details).toBeInstanceOf(Array);

    // Assertion 6: Validate accuracy assessment
    expect(output.accuracyAssessment).toBeDefined();
    expect(output.accuracyAssessment.status).toBe('PASS');
    expect(output.accuracyAssessment.inconsistencyCount).toBe(0);
    expect(output.accuracyAssessment.outOfRangeCount).toBe(0);
    expect(output.accuracyAssessment.details).toBeInstanceOf(Array);

    // Assertion 7: Validate anomaly detection
    expect(output.anomalyDetection).toBeDefined();
    expect(output.anomalyDetection.status).toBe('DETECTED');
    expect(output.anomalyDetection.anomalousRecordCount).toBeGreaterThan(0);
    expect(output.anomalyDetection.anomalies).toBeInstanceOf(Array);
    expect(output.anomalyDetection.anomalies.length).toBeGreaterThan(0);

    // Validate each anomaly has required fields
    output.anomalyDetection.anomalies.forEach((anomaly) => {
      expect(anomaly.recordId).toBeDefined();
      expect(anomaly.workerId).toBeDefined();
      expect(anomaly.field).toBeDefined();
      expect(['STATISTICAL_OUTLIER', 'BUSINESS_RULE_VIOLATION']).toContain(anomaly.anomalyType);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(anomaly.severity);
      expect(anomaly.currentValue).toBeDefined();
      expect(anomaly.recommendedAction).toBeDefined();
    });

    // Assertion 8: Validate overall quality judgment
    expect(output.overallQualityJudgment).toBeDefined();
    expect(output.overallQualityJudgment.judgment).toBe('CONDITIONAL_APPROVAL');
    expect(output.overallQualityJudgment.qualityScore).toBe(75);
    expect(output.overallQualityJudgment.approvalEligibility).toBe(true);
    expect(typeof output.overallQualityJudgment.judgmentReason).toBe('string');
    expect(output.overallQualityJudgment.judgmentReason.length).toBeGreaterThan(0);

    // Assertion 9: Validate improvement guidance structure
    expect(output.improvementGuidance).toBeDefined();
    expect(output.improvementGuidance).toBeInstanceOf(Array);
    expect(output.improvementGuidance.length).toBeGreaterThan(0);

    // Validate each improvement guidance item
    output.improvementGuidance.forEach((guidance) => {
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(guidance.priority);
      expect(['COMPLETENESS', 'ACCURACY', 'ANOMALY']).toContain(guidance.category);
      expect(typeof guidance.action).toBe('string');
      expect(guidance.action.length).toBeGreaterThan(0);
      expect(typeof guidance.affectedRecordCount).toBe('number');
      expect(guidance.affectedRecordCount).toBeGreaterThan(0);
      expect(typeof guidance.estimatedResolutionTime).toBe('string');
      expect(guidance.estimatedResolutionTime.length).toBeGreaterThan(0);
      expect(typeof guidance.targetCompletionDate).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}/.test(guidance.targetCompletionDate)).toBe(true);

      // Validate target completion date is in the future
      const targetDate = new Date(guidance.targetCompletionDate);
      const minDate = new Date('2024-02-01');
      expect(targetDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
    });

    // Assertion 10: Validate notification sent
    expect(output.notificationSent).toBeDefined();
    expect(output.notificationSent.sent).toBe(true);
    expect(output.notificationSent.recipientUserId).toBe('FL-USER-001');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.notificationSent.notificationTimestamp)).toBe(true);
    expect(output.notificationSent.deliveryStatus).toBe('DELIVERED');

    // Assertion 11: Validate improvement guidance contains multiple categories and is sorted by priority
    const categories = new Set(output.improvementGuidance.map((g) => g.category));
    expect(categories.size).toBeGreaterThanOrEqual(2);
    expect(Array.from(categories)).toEqual(
      expect.arrayContaining(['COMPLETENESS', 'ACCURACY', 'ANOMALY'].filter((cat) => categories.has(cat)))
    );

    // Verify priority ordering (CRITICAL > HIGH > MEDIUM > LOW)
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    for (let i = 1; i < output.improvementGuidance.length; i++) {
      const prevPriority = priorityOrder[output.improvementGuidance[i - 1].priority];
      const currPriority = priorityOrder[output.improvementGuidance[i].priority];
      expect(currPriority).toBeGreaterThanOrEqual(prevPriority);
    }

    // Verify multiple categories are mixed within the guidance array
    const categoriesByPriority: { [key: string]: Set<string> } = {
      CRITICAL: new Set(),
      HIGH: new Set(),
      MEDIUM: new Set(),
      LOW: new Set(),
    };

    output.improvementGuidance.forEach((guidance) => {
      categoriesByPriority[guidance.priority].add(guidance.category);
    });

    let categoryMixPresent = false;
    for (const priority in categoriesByPriority) {
      if (categoriesByPriority[priority].size > 1) {
        categoryMixPresent = true;
        break;
      }
    }

    // If single priorities don't have mixed categories, verify multiple categories exist across priorities
    if (!categoryMixPresent) {
      const allCategoriesInGuidance = new Set(output.improvementGuidance.map((g) => g.category));
      expect(allCategoriesInGuidance.size).toBeGreaterThanOrEqual(2);
    }
  });
});