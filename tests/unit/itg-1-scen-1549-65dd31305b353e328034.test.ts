import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1549: 進捗遅延リスク常時監視 - 承認された人員配置案がシステムに保存される', () => {
  it('monitorAndJudgeDelayRiskが正しいMonitorAndJudgeDelayRiskOutputを返す', async () => {
    // Arrange
    const input = {
      facilityIds: ['FAC-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T14:30:00Z',
      userId: 'user-001',
    };

    // Act
    const result = await monitorAndJudgeDelayRisk(input);

    // Assert - judgmentId is unique identifier
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Assert - evaluationDateTime matches input
    expect(result.evaluationDateTime).toBe('2024-01-15T14:30:00Z');

    // Assert - rankedFacilities array structure
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThanOrEqual(1);

    // Assert - FAC-001 exists in rankedFacilities
    const fac001Ranked = result.rankedFacilities.find(f => f.facilityId === 'FAC-001');
    expect(fac001Ranked).toBeDefined();

    // Assert - rankedFacilities[FAC-001] riskScore range
    expect(typeof fac001Ranked!.riskScore).toBe('number');
    expect(fac001Ranked!.riskScore).toBeGreaterThanOrEqual(0);
    expect(fac001Ranked!.riskScore).toBeLessThanOrEqual(100);

    // Assert - rankedFacilities[FAC-001] riskLevel is valid (lowercase as per spec)
    expect(['low', 'medium', 'high']).toContain(fac001Ranked!.riskLevel.toLowerCase());

    // Assert - rankedFacilities[FAC-001] priorityRank is positive integer
    expect(typeof fac001Ranked!.priorityRank).toBe('number');
    expect(fac001Ranked!.priorityRank).toBeGreaterThan(0);
    expect(Number.isInteger(fac001Ranked!.priorityRank)).toBe(true);

    // Assert - delayReasonClassifications array structure
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThanOrEqual(1);

    // Assert - FAC-001 exists in delayReasonClassifications
    const fac001Classification = result.delayReasonClassifications.find(
      d => d.facilityId === 'FAC-001'
    );
    expect(fac001Classification).toBeDefined();

    // Assert - delayReasonClassifications[FAC-001] contributions are numeric
    expect(typeof fac001Classification!.insufficientStaffContribution).toBe('number');
    expect(typeof fac001Classification!.efficiencyDeclineContribution).toBe('number');
    expect(typeof fac001Classification!.priorityMisalignmentContribution).toBe('number');

    // Assert - contributions are in valid range
    expect(fac001Classification!.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
    expect(fac001Classification!.insufficientStaffContribution).toBeLessThanOrEqual(100);
    expect(fac001Classification!.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
    expect(fac001Classification!.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
    expect(fac001Classification!.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
    expect(fac001Classification!.priorityMisalignmentContribution).toBeLessThanOrEqual(100);

    // Assert - contributions sum to approximately 100
    const totalContribution =
      fac001Classification!.insufficientStaffContribution +
      fac001Classification!.efficiencyDeclineContribution +
      fac001Classification!.priorityMisalignmentContribution;
    expect(totalContribution).toBeCloseTo(100, 0);

    // Assert - primaryDelayReason is valid (snake_case as per spec)
    expect(['insufficient_staff', 'efficiency_decline', 'priority_misalignment']).toContain(
      fac001Classification!.primaryDelayReason.toLowerCase()
    );

    // Assert - responseUrgency is valid enum value
    expect(typeof fac001Classification!.responseUrgency).toBe('string');
    expect(['immediate', 'urgent', 'normal']).toContain(
      fac001Classification!.responseUrgency.toLowerCase()
    );

    // Assert - recommendedAdjustments array structure
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(1);

    // Assert - FAC-001 exists in recommendedAdjustments
    const fac001Adjustment = result.recommendedAdjustments.find(
      a => a.facilityId === 'FAC-001'
    );
    expect(fac001Adjustment).toBeDefined();

    // Assert - recommendedAdjustments[FAC-001] description is string
    expect(typeof fac001Adjustment!.adjustmentDescription).toBe('string');
    expect(fac001Adjustment!.adjustmentDescription.length).toBeGreaterThan(0);

    // Assert - hasHighRiskFacilities is boolean
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    // Assert - hasHighRiskFacilities consistency with rankedFacilities
    const hasHighRiskInRanked = result.rankedFacilities.some(
      f => f.riskLevel.toLowerCase() === 'high'
    );
    if (hasHighRiskInRanked) {
      expect(result.hasHighRiskFacilities).toBe(true);
    } else {
      expect(result.hasHighRiskFacilities).toBe(false);
    }
  });
});