import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-123: 遅延リスク度スコア算出と拠点優先度付与', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should calculate risk scores and rank facilities by risk priority', async () => {
    // Mock the internal functions
    const mockValidateReferentialIntegrity = jest.spyOn(riskEngine as any, 'validateReferentialIntegrity').mockResolvedValue(true);
    const mockCalculateDelayRiskScore = jest.spyOn(riskEngine as any, 'calculateDelayRiskScore');
    const mockClassifyDelayReason = jest.spyOn(riskEngine as any, 'classifyDelayReason');
    const mockRankFacilitiesByRiskPriority = jest.spyOn(riskEngine as any, 'rankFacilitiesByRiskPriority');
    const mockSaveDelayRiskJudgment = jest.spyOn(riskEngine as any, 'saveDelayRiskJudgment').mockResolvedValue({
      judgmentId: '123e4567-e89b-12d3-a456-426614174000',
    });

    // Setup mock responses for calculateDelayRiskScore
    mockCalculateDelayRiskScore.mockImplementation((input) => {
      if (input.facilityId === 'FAC001') {
        return Promise.resolve(52);
      } else if (input.facilityId === 'FAC002') {
        return Promise.resolve(85);
      } else if (input.facilityId === 'FAC003') {
        return Promise.resolve(15);
      }
      return Promise.resolve(0);
    });

    // Setup mock responses for classifyDelayReason
    mockClassifyDelayReason.mockImplementation((input) => {
      if (input.facilityId === 'FAC001') {
        return Promise.resolve({
          facilityId: 'FAC001',
          teamId: undefined,
          insufficientStaffContribution: 40,
          efficiencyDeclineContribution: 35,
          priorityMisalignmentContribution: 25,
          primaryDelayReason: 'INSUFFICIENT_STAFF',
          responseUrgency: 'URGENT',
        });
      } else if (input.facilityId === 'FAC002') {
        return Promise.resolve({
          facilityId: 'FAC002',
          teamId: undefined,
          insufficientStaffContribution: 55,
          efficiencyDeclineContribution: 30,
          priorityMisalignmentContribution: 15,
          primaryDelayReason: 'INSUFFICIENT_STAFF',
          responseUrgency: 'IMMEDIATE',
        });
      } else if (input.facilityId === 'FAC003') {
        return Promise.resolve({
          facilityId: 'FAC003',
          teamId: undefined,
          insufficientStaffContribution: 20,
          efficiencyDeclineContribution: 30,
          priorityMisalignmentContribution: 50,
          primaryDelayReason: 'PRIORITY_MISALIGNMENT',
          responseUrgency: 'NORMAL',
        });
      }
      return Promise.resolve({
        facilityId: input.facilityId,
        insufficientStaffContribution: 0,
        efficiencyDeclineContribution: 0,
        priorityMisalignmentContribution: 0,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
        responseUrgency: 'NORMAL',
      });
    });

    // Setup mock response for rankFacilitiesByRiskPriority
    mockRankFacilitiesByRiskPriority.mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'FAC002',
          facilityName: 'Facility 002',
          riskScore: 85,
          riskLevel: 'HIGH',
          predictedDelayDays: 0.625,
          currentProgressRate: 45,
          plannedProgressRate: 60,
          priorityRank: 1,
        },
        {
          facilityId: 'FAC001',
          facilityName: 'Facility 001',
          riskScore: 52,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 0.125,
          currentProgressRate: 65,
          plannedProgressRate: 70,
          priorityRank: 2,
        },
        {
          facilityId: 'FAC003',
          facilityName: 'Facility 003',
          riskScore: 15,
          riskLevel: 'LOW',
          predictedDelayDays: 0,
          currentProgressRate: 80,
          plannedProgressRate: 75,
          priorityRank: 3,
        },
      ],
    });

    const input = {
      facilityIds: ['FAC001', 'FAC002', 'FAC003'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T14:30:00Z',
      userId: 'USER001',
    };

    // Execute the function
    const result = await monitorAndJudgeDelayRisk(input);

    // Verify output structure
    expect(result).toHaveProperty('judgmentId');
    expect(result).toHaveProperty('evaluationDateTime');
    expect(result).toHaveProperty('rankedFacilities');
    expect(result).toHaveProperty('delayReasonClassifications');
    expect(result).toHaveProperty('recommendedAdjustments');
    expect(result).toHaveProperty('hasHighRiskFacilities');

    // Verify judgment ID is UUID format
    expect(result.judgmentId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Verify evaluation date time matches input
    expect(result.evaluationDateTime).toBe('2024-01-15T14:30:00Z');

    // Verify ranked facilities are sorted by risk score descending
    expect(result.rankedFacilities).toHaveLength(3);

    // Verify FAC002 (highest risk)
    expect(result.rankedFacilities[0].facilityId).toBe('FAC002');
    expect(result.rankedFacilities[0].riskScore).toBe(85);
    expect(result.rankedFacilities[0].riskLevel).toBe('HIGH');
    expect(result.rankedFacilities[0].priorityRank).toBe(1);
    expect(result.rankedFacilities[0].predictedDelayDays).toBe(0.625);

    // Verify FAC001 (medium risk)
    expect(result.rankedFacilities[1].facilityId).toBe('FAC001');
    expect(result.rankedFacilities[1].riskScore).toBe(52);
    expect(result.rankedFacilities[1].riskLevel).toBe('MEDIUM');
    expect(result.rankedFacilities[1].priorityRank).toBe(2);
    expect(result.rankedFacilities[1].predictedDelayDays).toBe(0.125);

    // Verify FAC003 (low risk)
    expect(result.rankedFacilities[2].facilityId).toBe('FAC003');
    expect(result.rankedFacilities[2].riskScore).toBe(15);
    expect(result.rankedFacilities[2].riskLevel).toBe('LOW');
    expect(result.rankedFacilities[2].priorityRank).toBe(3);
    expect(result.rankedFacilities[2].predictedDelayDays).toBe(0);

    // Verify delay reason classifications
    expect(result.delayReasonClassifications).toHaveLength(3);

    const fac002Classification = result.delayReasonClassifications.find(
      (c) => c.facilityId === 'FAC002'
    );
    expect(fac002Classification).toBeDefined();
    expect(fac002Classification?.primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(fac002Classification?.insufficientStaffContribution).toBe(55);
    expect(fac002Classification?.efficiencyDeclineContribution).toBe(30);
    expect(fac002Classification?.priorityMisalignmentContribution).toBe(15);

    const fac001Classification = result.delayReasonClassifications.find(
      (c) => c.facilityId === 'FAC001'
    );
    expect(fac001Classification).toBeDefined();
    expect(fac001Classification?.primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(fac001Classification?.insufficientStaffContribution).toBe(40);
    expect(fac001Classification?.efficiencyDeclineContribution).toBe(35);
    expect(fac001Classification?.priorityMisalignmentContribution).toBe(25);

    const fac003Classification = result.delayReasonClassifications.find(
      (c) => c.facilityId === 'FAC003'
    );
    expect(fac003Classification).toBeDefined();
    expect(fac003Classification?.primaryDelayReason).toBe('PRIORITY_MISALIGNMENT');
    expect(fac003Classification?.insufficientStaffContribution).toBe(20);
    expect(fac003Classification?.efficiencyDeclineContribution).toBe(30);
    expect(fac003Classification?.priorityMisalignmentContribution).toBe(50);

    // Verify high risk facilities flag
    expect(result.hasHighRiskFacilities).toBe(true);

    // Verify recommended adjustments contain high-risk facilities
    const fac002Adjustment = result.recommendedAdjustments.find(
      (a) => a.facilityId === 'FAC002'
    );
    expect(fac002Adjustment).toBeDefined();
    expect(fac002Adjustment?.adjustmentDescription).toContain('人員');

    const fac001Adjustment = result.recommendedAdjustments.find(
      (a) => a.facilityId === 'FAC001'
    );
    expect(fac001Adjustment).toBeDefined();
    expect(fac001Adjustment?.adjustmentDescription).toContain('優先度');

    // Verify stub functions were called with expected inputs and in expected order
    expect(mockValidateReferentialIntegrity).toHaveBeenCalled();
    expect(mockCalculateDelayRiskScore).toHaveBeenCalledTimes(3);
    expect(mockClassifyDelayReason).toHaveBeenCalledTimes(3);
    expect(mockRankFacilitiesByRiskPriority).toHaveBeenCalled();
    expect(mockSaveDelayRiskJudgment).toHaveBeenCalled();

    // Verify no errors occurred
    expect(result).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(typeof result.evaluationDateTime).toBe('string');
  });
});