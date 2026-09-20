import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

// Mock external dependencies
jest.mock('../../src/persistence/data-access-layer');
jest.mock('../../src/logic/validation-layer');
jest.mock('../../src/logic/risk-calculation-layer');

import * as dataAccessLayer from '../../src/persistence/data-access-layer';
import * as validationLayer from '../../src/logic/validation-layer';
import * as riskCalculationLayer from '../../src/logic/risk-calculation-layer';

describe('SCEN-129: 古い進捗データの警告記録', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('進捗データが1時間以上前の場合、警告を含むrecommendedAdjustmentsを返すこと', async () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    jest.setSystemTime(currentTime);

    const evaluationDateTime = '2024-01-15T10:00:00Z';
    const dataTimestamp = '2024-01-15T08:45:00Z';

    const input = {
      facilityIds: ['FAC-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime,
      userId: 'USER-123',
    };

    // Set up mocks for data access layer - using work instruction based method
    (dataAccessLayer.getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue([
      {
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        timestamp: dataTimestamp,
        plannedProgressRate: 50,
        actualProgressRate: 30,
        completedQuantity: 150,
        totalQuantity: 500,
      },
    ]);

    (dataAccessLayer.getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue([
      {
        workerId: 'W-001',
        facilityId: 'FAC-001',
        productivity: 85,
        qualityScore: 90,
        timestamp: dataTimestamp,
        allocatedStaffCount: 3,
        requiredStaffCount: 4,
        averageProductivityRate: 85,
      },
      {
        workerId: 'W-002',
        facilityId: 'FAC-001',
        productivity: 80,
        qualityScore: 88,
        timestamp: dataTimestamp,
        allocatedStaffCount: 3,
        requiredStaffCount: 4,
        averageProductivityRate: 80,
      },
    ]);

    (dataAccessLayer.saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      judgmentId: 'JUD-001',
    });

    // Set up mocks for validation layer
    (validationLayer.validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);

    // Set up mocks for risk calculation layer
    (riskCalculationLayer.calculateRiskScore as jest.Mock).mockReturnValue(75);
    (riskCalculationLayer.calculateDelayRiskScore as jest.Mock).mockReturnValue(72);
    (riskCalculationLayer.classifyDelayReason as jest.Mock).mockReturnValue({
      facilityId: 'FAC-001',
      teamId: undefined,
      insufficientStaffContribution: 40,
      efficiencyDeclineContribution: 35,
      priorityMisalignmentContribution: 25,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    });

    (riskCalculationLayer.rankFacilitiesByRiskPriority as jest.Mock).mockReturnValue({
      rankedFacilities: [
        {
          facilityId: 'FAC-001',
          facilityName: 'Facility 001',
          riskScore: 75,
          riskLevel: 'HIGH',
          predictedDelayDays: 2,
          currentProgressRate: 30,
          plannedProgressRate: 50,
          priorityRank: 1,
        },
      ],
    });

    let thrownError: Error | undefined;
    let output: any;

    try {
      output = await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // Verify no error occurred
    expect(thrownError).toBeUndefined();

    // Verify basic structure
    expect(output).toBeDefined();
    expect(output.judgmentId).toBeTruthy();
    expect(typeof output.judgmentId).toBe('string');
    expect(output.evaluationDateTime).toBe(evaluationDateTime);

    // Verify rankedFacilities
    expect(Array.isArray(output.rankedFacilities)).toBe(true);
    expect(output.rankedFacilities.length).toBeGreaterThan(0);
    expect(output.rankedFacilities[0]).toHaveProperty('facilityId');
    expect(output.rankedFacilities[0]).toHaveProperty('facilityName');
    expect(output.rankedFacilities[0]).toHaveProperty('riskScore');
    expect(output.rankedFacilities[0]).toHaveProperty('riskLevel');
    expect(output.rankedFacilities[0]).toHaveProperty('predictedDelayDays');
    expect(output.rankedFacilities[0]).toHaveProperty('currentProgressRate');
    expect(output.rankedFacilities[0]).toHaveProperty('plannedProgressRate');
    expect(output.rankedFacilities[0]).toHaveProperty('priorityRank');

    // Verify delayReasonClassifications
    expect(Array.isArray(output.delayReasonClassifications)).toBe(true);
    expect(output.delayReasonClassifications.length).toBeGreaterThan(0);
    expect(output.delayReasonClassifications[0]).toHaveProperty('facilityId');
    expect(output.delayReasonClassifications[0]).toHaveProperty(
      'insufficientStaffContribution'
    );
    expect(output.delayReasonClassifications[0]).toHaveProperty(
      'efficiencyDeclineContribution'
    );
    expect(output.delayReasonClassifications[0]).toHaveProperty(
      'priorityMisalignmentContribution'
    );
    expect(output.delayReasonClassifications[0]).toHaveProperty('primaryDelayReason');
    expect(output.delayReasonClassifications[0]).toHaveProperty('responseUrgency');

    // Verify hasHighRiskFacilities
    expect(typeof output.hasHighRiskFacilities).toBe('boolean');

    // Verify recommendedAdjustments array exists
    expect(Array.isArray(output.recommendedAdjustments)).toBe(true);
    expect(output.recommendedAdjustments.length).toBeGreaterThan(0);

    // Verify each recommended adjustment has required fields
    output.recommendedAdjustments.forEach((adjustment: any) => {
      expect(adjustment).toHaveProperty('facilityId');
      expect(adjustment).toHaveProperty('adjustmentType');
      expect(adjustment).toHaveProperty('adjustmentDescription');
      expect(adjustment).toHaveProperty('estimatedEffectiveness');
      expect(adjustment).toHaveProperty('implementationPriority');
      expect(typeof adjustment.facilityId).toBe('string');
      expect(typeof adjustment.adjustmentType).toBe('string');
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(typeof adjustment.implementationPriority).toBe('number');
    });

    // Verify data timestamp is at least 1 hour old
    const evaluationTime = new Date(evaluationDateTime).getTime();
    const dataTime = new Date(dataTimestamp).getTime();
    const timeDifferenceMs = evaluationTime - dataTime;
    const oneHourMs = 60 * 60 * 1000;
    expect(timeDifferenceMs).toBeGreaterThanOrEqual(oneHourMs);

    // Verify warning message is included in recommendedAdjustments description
    const warningAdjustments = output.recommendedAdjustments.filter((adjustment: any) =>
      adjustment.adjustmentDescription.includes(
        '進捗データが古い可能性があります。最新データで再実行を推奨'
      )
    );

    expect(warningAdjustments.length).toBeGreaterThan(0);
    const warningAdjustment = warningAdjustments[0];
    expect(warningAdjustment.facilityId).toBe('FAC-001');
    expect(warningAdjustment.adjustmentDescription).toContain(
      '進捗データが古い可能性があります。最新データで再実行を推奨'
    );
  });
});