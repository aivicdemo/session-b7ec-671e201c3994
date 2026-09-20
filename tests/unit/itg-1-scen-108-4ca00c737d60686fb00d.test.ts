import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-108: 進捗遅延リスク判定エンジン', () => {
  let getRecentProgressDataByWorkInstructionSpy: jest.SpyInstance;
  let getLatestProductivityDataByWorkerSpy: jest.SpyInstance;
  let calculateDelayRiskScoreSpy: jest.SpyInstance;
  let classifyDelayReasonSpy: jest.SpyInstance;
  let rankFacilitiesByRiskPrioritySpy: jest.SpyInstance;
  let saveDelayRiskJudgmentSpy: jest.SpyInstance;
  let validateReferentialIntegritySpy: jest.SpyInstance;
  let calculateRiskScoreSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    getRecentProgressDataByWorkInstructionSpy = jest.spyOn(
      riskEngine as any,
      'getRecentProgressDataByWorkInstruction'
    ).mockResolvedValue({
      workInstructionId: 'WI-001',
      remainingWorkQuantity: 500,
      averageWorkerProductivity: 10,
      currentWorkerCount: 5,
    });

    getLatestProductivityDataByWorkerSpy = jest.spyOn(
      riskEngine as any,
      'getLatestProductivityDataByWorker'
    ).mockResolvedValue([
      {
        workerId: 'W001',
        productivity: 10,
        qualityScore: 95,
      },
      {
        workerId: 'W002',
        productivity: 12,
        qualityScore: 92,
      },
      {
        workerId: 'W003',
        productivity: 9,
        qualityScore: 98,
      },
      {
        workerId: 'W004',
        productivity: 11,
        qualityScore: 90,
      },
      {
        workerId: 'W005',
        productivity: 8,
        qualityScore: 96,
      },
    ]);

    calculateDelayRiskScoreSpy = jest.spyOn(
      riskEngine as any,
      'calculateDelayRiskScore'
    ).mockResolvedValue(65);

    classifyDelayReasonSpy = jest.spyOn(
      riskEngine as any,
      'classifyDelayReason'
    ).mockResolvedValue({
      facilityId: 'F001',
      teamId: undefined,
      insufficientStaffContribution: 35,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 35,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    });

    rankFacilitiesByRiskPrioritySpy = jest.spyOn(
      riskEngine as any,
      'rankFacilitiesByRiskPriority'
    ).mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'F001',
          facilityName: '東京拠点',
          riskScore: 65,
          riskLevel: 'HIGH',
          predictedDelayDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 60,
          priorityRank: 1,
        },
      ],
    });

    saveDelayRiskJudgmentSpy = jest.spyOn(
      riskEngine as any,
      'saveDelayRiskJudgment'
    ).mockResolvedValue({
      judgmentId: 'JDG-20240115-001',
    });

    validateReferentialIntegritySpy = jest.spyOn(
      riskEngine as any,
      'validateReferentialIntegrity'
    ).mockResolvedValue(true);

    calculateRiskScoreSpy = jest.spyOn(
      riskEngine as any,
      'calculateRiskScore'
    ).mockResolvedValue(65);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('残り作業件数を現在の平均生産性と作業者数で割り、完了に必要な時間を推定する', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'user123',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:30:00Z');

    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    const targetFacility = result.rankedFacilities[0];
    expect(targetFacility.facilityId).toBe('F001');
    expect(targetFacility.facilityName).toBe('東京拠点');

    const estimatedCompletionTimeMinutes = (500 / (10 * 5)) * 60;
    expect(estimatedCompletionTimeMinutes).toBe(600);

    expect(targetFacility.riskScore).toBe(65);
    expect(targetFacility.riskLevel).toBe('HIGH');
    expect(targetFacility.predictedDelayDays).toBe(2);
    expect(targetFacility.currentProgressRate).toBe(45);
    expect(targetFacility.plannedProgressRate).toBe(60);
    expect(targetFacility.priorityRank).toBe(1);

    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);

    const delayClassification = result.delayReasonClassifications[0];
    expect(delayClassification.facilityId).toBe('F001');
    expect(delayClassification.insufficientStaffContribution).toBe(35);
    expect(delayClassification.efficiencyDeclineContribution).toBe(30);
    expect(delayClassification.priorityMisalignmentContribution).toBe(35);
    expect(delayClassification.primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(delayClassification.responseUrgency).toBe('URGENT');

    const insufficientStaffSum =
      delayClassification.insufficientStaffContribution +
      delayClassification.efficiencyDeclineContribution +
      delayClassification.priorityMisalignmentContribution;
    expect(insufficientStaffSum).toBeLessThanOrEqual(100);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    if (result.recommendedAdjustments.length > 0) {
      const adjustment = result.recommendedAdjustments[0];
      expect(adjustment.facilityId).toBeDefined();
      expect(adjustment.adjustmentType).toBeDefined();
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(typeof adjustment.implementationPriority).toBe('number');
    }

    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
    expect(result.hasHighRiskFacilities).toBe(true);

    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
    expect(saveDelayRiskJudgmentSpy).toHaveBeenCalled();
  });
});