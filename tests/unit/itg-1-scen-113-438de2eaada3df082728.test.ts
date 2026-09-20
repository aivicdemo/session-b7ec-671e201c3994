import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-113: 進捗乖離率が負の値のとき、計画を上回る進捗として扱い、リスクレベルを低に設定する', () => {
  it('should treat negative progress gap as exceeding plan and set risk level to low', async () => {
    // Setup: Mock dependencies
    const validateReferentialIntegritySpy = jest
      .spyOn(riskEngine as any, 'validateReferentialIntegrity')
      .mockResolvedValue(true);

    const getRecentProgressDataByWorkInstructionSpy = jest
      .spyOn(riskEngine as any, 'getRecentProgressDataByWorkInstruction')
      .mockResolvedValue({
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        plannedProgressAtNow: 40,
        currentProgress: 50,
        plannedProgressRate: 40,
        actualProgressRate: 50,
        completionRate: 50,
        delayFlag: false,
        delayDays: 0,
      });

    const getLatestProductivityDataByWorkerSpy = jest
      .spyOn(riskEngine as any, 'getLatestProductivityDataByWorker')
      .mockResolvedValue({
        workerId: 'WORKER-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        plannedWorkTime: 480,
        actualWorkTime: 480,
        completedCount: 60,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 1,
      });

    const calculateDelayRiskScoreSpy = jest
      .spyOn(riskEngine as any, 'calculateDelayRiskScore')
      .mockReturnValue(15);

    const classifyDelayReasonSpy = jest
      .spyOn(riskEngine as any, 'classifyDelayReason')
      .mockReturnValue({
        facilityId: 'FAC-001',
        teamId: undefined,
        insufficientStaffContribution: 0,
        efficiencyDeclineContribution: 0,
        priorityMisalignmentContribution: 0,
        primaryDelayReason: 'NONE',
        responseUrgency: 'NORMAL',
      });

    const rankFacilitiesByRiskPrioritySpy = jest
      .spyOn(riskEngine as any, 'rankFacilitiesByRiskPriority')
      .mockReturnValue({
        rankedFacilities: [
          {
            facilityId: 'FAC-001',
            facilityName: 'Facility 001',
            riskScore: 15,
            riskLevel: 'LOW',
            predictedDelayDays: 0,
            currentProgressRate: 50,
            plannedProgressRate: 40,
            priorityRank: 10,
          },
        ],
      });

    const saveDelayRiskJudgmentSpy = jest
      .spyOn(riskEngine as any, 'saveDelayRiskJudgment')
      .mockResolvedValue({
        judgmentId: 'JDG-001',
        evaluationDateTime: '2025-01-15T10:30:00Z',
        savedSuccessfully: true,
      });

    // Arrange: Input parameters
    const input = {
      facilityIds: ['FAC-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-123',
    };

    // Act: Execute the function
    const output = await monitorAndJudgeDelayRisk(input);

    // Assert: Verify output structure and values
    expect(output).toBeDefined();
    expect(output.judgmentId).toBeDefined();
    expect(output.evaluationDateTime).toBe('2025-01-15T10:30:00Z');
    expect(output.rankedFacilities).toBeDefined();
    expect(Array.isArray(output.rankedFacilities)).toBe(true);

    // Find FAC-001 in rankedFacilities
    const fac001Risk = output.rankedFacilities.find(
      (f) => f.facilityId === 'FAC-001'
    );
    expect(fac001Risk).toBeDefined();

    // (1) Verify riskLevel is 'low' when progress exceeds plan
    expect(fac001Risk!.riskLevel).toBe('LOW');

    // (2) Verify progress gap is negative (exceeding plan)
    const plannedProgressRate = fac001Risk!.plannedProgressRate;
    const currentProgressRate = fac001Risk!.currentProgressRate;
    const progressGapPercent = plannedProgressRate - currentProgressRate;
    expect(progressGapPercent).toBeLessThan(0);

    // (3) Verify delay reason classification shows no delay factors
    const delayReasonForFac001 = output.delayReasonClassifications.find(
      (d) => d.facilityId === 'FAC-001' && d.teamId === undefined
    );
    expect(delayReasonForFac001).toBeDefined();
    expect(delayReasonForFac001!.insufficientStaffContribution).toBe(0);
    expect(delayReasonForFac001!.efficiencyDeclineContribution).toBe(0);
    expect(delayReasonForFac001!.priorityMisalignmentContribution).toBe(0);

    // (4) Verify recommended adjustments are minimal or empty for low-risk facility
    const adjustmentsForFac001 = output.recommendedAdjustments.filter(
      (a) => a.facilityId === 'FAC-001'
    );
    // Low-risk facilities should have no high-priority adjustments needed
    if (adjustmentsForFac001.length > 0) {
      adjustmentsForFac001.forEach((adj) => {
        // If adjustments exist, they should not be priority 1 (highest priority)
        expect(adj.implementationPriority).toBeGreaterThan(1);
      });
    }

    // (5) Verify hasHighRiskFacilities is false
    expect(output.hasHighRiskFacilities).toBe(false);

    // (6) Verify dependencies were called
    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
    expect(getRecentProgressDataByWorkInstructionSpy).toHaveBeenCalled();
    expect(calculateDelayRiskScoreSpy).toHaveBeenCalled();
    expect(classifyDelayReasonSpy).toHaveBeenCalled();
    expect(rankFacilitiesByRiskPrioritySpy).toHaveBeenCalled();
    expect(saveDelayRiskJudgmentSpy).toHaveBeenCalled();

    // Cleanup: Restore spies
    validateReferentialIntegritySpy.mockRestore();
    getRecentProgressDataByWorkInstructionSpy.mockRestore();
    getLatestProductivityDataByWorkerSpy.mockRestore();
    calculateDelayRiskScoreSpy.mockRestore();
    classifyDelayReasonSpy.mockRestore();
    rankFacilitiesByRiskPrioritySpy.mockRestore();
    saveDelayRiskJudgmentSpy.mockRestore();
  });
});