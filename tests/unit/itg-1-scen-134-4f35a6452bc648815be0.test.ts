import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as progressMonitoringModule from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-134: 高リスク拠点が存在する場合、hasHighRiskFacilitiesをtrueに設定する', () => {
  it('should set hasHighRiskFacilities to true when high-risk facilities exist', async () => {
    // Arrange
    const input = {
      facilityIds: ['facility-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T14:30:00Z',
      userId: 'user-admin-001',
    };

    const HIGH_RISK_THRESHOLD = 70;

    const mockProgressData = [
      {
        workInstructionId: 'wi-001',
        facilityId: 'facility-001',
        plannedProgressRate: 80,
        currentProgressRate: 40,
        remainingWorkDays: 2,
      },
    ];

    const mockProductivityData = [
      {
        facilityId: 'facility-001',
        productivityRate: 60,
        qualityScore: 75,
        allocatedStaffCount: 3,
        requiredStaffCount: 5,
      },
    ];

    const mockRankedFacilities = [
      {
        facilityId: 'facility-001',
        facilityName: 'Main Facility',
        riskScore: 85,
        riskLevel: 'HIGH',
        predictedDelayDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 80,
        priorityRank: 1,
      },
    ];

    const mockDelayReasons = [
      {
        facilityId: 'facility-001',
        teamId: undefined,
        insufficientStaffContribution: 50,
        efficiencyDeclineContribution: 30,
        priorityMisalignmentContribution: 20,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
        responseUrgency: 'IMMEDIATE',
      },
    ];

    const mockRecommendedAdjustments = [
      {
        facilityId: 'facility-001',
        adjustmentType: 'ADD_PERSONNEL',
        adjustmentDescription: 'Add 2 staff members to facility-001',
        estimatedEffectiveness: 75,
        implementationPriority: 1,
      },
    ];

    // Mock internal functions
    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any).mockResolvedValue(mockProgressData);
    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any).mockResolvedValue(true);
    jest.spyOn(progressMonitoringModule, 'calculateRiskScore' as any).mockReturnValue(85);
    jest.spyOn(progressMonitoringModule, 'calculateDelayRiskScore' as any).mockReturnValue(85);
    jest.spyOn(progressMonitoringModule, 'classifyDelayReason' as any).mockResolvedValue(mockDelayReasons[0]);
    jest.spyOn(progressMonitoringModule, 'rankFacilitiesByRiskPriority' as any).mockResolvedValue(mockRankedFacilities);
    jest.spyOn(progressMonitoringModule, 'saveDelayRiskJudgment' as any).mockResolvedValue({ success: true });

    // Act
    const result = await monitorAndJudgeDelayRisk(input);

    // Assert
    expect(result.hasHighRiskFacilities).toBe(true);
    expect(result.rankedFacilities).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThanOrEqual(1);
    
    const hasHighRiskFacility = result.rankedFacilities.some(
      (facility) => facility.riskScore >= HIGH_RISK_THRESHOLD
    );
    expect(hasHighRiskFacility).toBe(true);
    
    expect(result.delayReasonClassifications).toBeDefined();
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    result.delayReasonClassifications.forEach((classification) => {
      expect(classification.facilityId).toBeDefined();
      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        classification.primaryDelayReason
      );
      expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
      expect(classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
    });
    
    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);
    result.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustment.adjustmentType
      );
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});