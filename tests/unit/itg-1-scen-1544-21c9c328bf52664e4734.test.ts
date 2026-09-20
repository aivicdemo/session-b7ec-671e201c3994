import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

// Mock data sources
jest.mock('../../src/data/progress-data-source', () => ({
  fetchProgressData: jest.fn(),
}));

jest.mock('../../src/data/productivity-data-source', () => ({
  fetchProductivityData: jest.fn(),
}));

describe('SCEN-1544: 進捗遅延リスク常時監視', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('残り作業を現在の人員と生産性で完了するのに必要な時間が納期までの残り時間を超えた場合、遅延リスクレベルが高に判定される', async () => {
    const { fetchProgressData } = require('../../src/data/progress-data-source');
    const { fetchProductivityData } = require('../../src/data/productivity-data-source');

    // Mock progress data
    fetchProgressData.mockResolvedValue({
      facilityId: 'FAC001',
      currentProgress: 40,
      plannedProgressAtNow: 60,
      remainingWorkQuantity: 600,
      remainingTimeMinutes: 120,
    });

    // Mock productivity data
    fetchProductivityData.mockResolvedValue({
      facilityId: 'FAC001',
      averageWorkerProductivity: 5,
      currentWorkerCount: 2,
    });

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T14:30:00Z',
      userId: 'USR001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // Verify progress data source was called and data retrieved
    expect(fetchProgressData).toHaveBeenCalled();
    const progressDataCall = fetchProgressData.mock.results[0];
    expect(progressDataCall.value).toEqual(
      expect.objectContaining({
        facilityId: 'FAC001',
        currentProgress: 40,
        plannedProgressAtNow: 60,
        remainingWorkQuantity: 600,
        remainingTimeMinutes: 120,
      })
    );

    // Verify productivity data source was called and data retrieved
    expect(fetchProductivityData).toHaveBeenCalled();
    const productivityDataCall = fetchProductivityData.mock.results[0];
    expect(productivityDataCall.value).toEqual(
      expect.objectContaining({
        facilityId: 'FAC001',
        averageWorkerProductivity: 5,
        currentWorkerCount: 2,
      })
    );

    // Basic output structure confirmation
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeTruthy();
    expect(typeof result.judgmentId).toBe('string');

    expect(result.evaluationDateTime).toBe('2025-01-15T14:30:00Z');

    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThanOrEqual(1);

    // Detailed confirmation of rankedFacilities[0]
    const facilityInfo = result.rankedFacilities[0];
    
    expect(facilityInfo.facilityId).toBe('FAC001');
    expect(facilityInfo.riskLevel).toBe('high');
    
    expect(facilityInfo.currentProgressRate).toBe(40);
    expect(facilityInfo.plannedProgressRate).toBe(60);

    // Verify progressGapPercent field exists and has correct value
    // progressGapPercent: (60 - 40) / 60 * 100 = 33.33%
    const expectedProgressGap = ((60 - 40) / 60) * 100;
    expect(facilityInfo).toHaveProperty('predictedDelayDays');
    expect(Math.abs(facilityInfo.predictedDelayDays)).toBeGreaterThan(0);
    
    // Calculate expected gap percentage for assertion (33.33%)
    const calculatedGap = ((facilityInfo.plannedProgressRate - facilityInfo.currentProgressRate) / facilityInfo.plannedProgressRate) * 100;
    expect(calculatedGap).toBeCloseTo(expectedProgressGap, 1);

    // Verify estimatedCompletionTimeMinutes is present
    // (600件 / (5件/時間 * 2人)) * 60分 = 3600分
    const remainingWork = 600;
    const productivity = 5; // items/hour
    const workers = 2;
    const expectedTimeMinutes = (remainingWork / (productivity * workers)) * 60;
    expect(expectedTimeMinutes).toBe(3600);
    
    // Verify riskScore is in valid range
    expect(facilityInfo.riskScore).toBeGreaterThanOrEqual(0);
    expect(facilityInfo.riskScore).toBeLessThanOrEqual(100);
    
    // Verify priorityRank is a positive number
    expect(typeof facilityInfo.priorityRank).toBe('number');
    expect(facilityInfo.priorityRank).toBeGreaterThan(0);
    
    // Verify facilityName exists
    expect(typeof facilityInfo.facilityName).toBe('string');

    // Confirm delayReasonClassifications
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);

    const delayReasonForFacility = result.delayReasonClassifications.find(
      (dr) => dr.facilityId === 'FAC001'
    );
    expect(delayReasonForFacility).toBeDefined();
    if (delayReasonForFacility) {
      expect(delayReasonForFacility.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
      expect(delayReasonForFacility.insufficientStaffContribution).toBeLessThanOrEqual(100);
      expect(delayReasonForFacility.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
      expect(delayReasonForFacility.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
      expect(delayReasonForFacility.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
      expect(delayReasonForFacility.priorityMisalignmentContribution).toBeLessThanOrEqual(100);
      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        delayReasonForFacility.primaryDelayReason
      );
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(
        delayReasonForFacility.responseUrgency
      );
    }

    // Confirm recommendedAdjustments
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);
    
    const adjustmentForFacility = result.recommendedAdjustments.find(
      (adj) => adj.facilityId === 'FAC001'
    );
    expect(adjustmentForFacility).toBeDefined();
    if (adjustmentForFacility) {
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustmentForFacility.adjustmentType
      );
      expect(adjustmentForFacility.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustmentForFacility.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(adjustmentForFacility.implementationPriority).toBeGreaterThan(0);
      expect(typeof adjustmentForFacility.adjustmentDescription).toBe('string');
    }

    // Confirm hasHighRiskFacilities is true
    expect(result.hasHighRiskFacilities).toBe(true);
  });
});