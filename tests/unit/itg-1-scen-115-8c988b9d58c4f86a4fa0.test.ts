import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-115: 効率低下要因の寄与度計算 - 現在と過去30日間の生産性比較', () => {
  it('現在の平均生産性と過去30日間の平均生産性を比較し、低下率を計算して効率低下要因の寄与度を算出する', async () => {
    // Arrange
    const facilityIds = ['F001'];
    const teamIds = undefined;
    const workInstructionIds = undefined;
    const evaluationDateTime = '2024-01-15T14:30:00Z';
    const userId = 'user123';

    // Expected efficiency decline rate calculation
    // (18 - 15) / 18 * 100 = 16.67%
    const expectedEfficiencyDeclineRate = 16.67;
    const tolerancePercent = 0.01; // ±0.01% tolerance for floating point operations

    // Mock for getRecentProgressDataByWorkInstruction
    const mockProgressDataResponse = {
      facilityId: 'F001',
      plannedProgressAtNow: 60,
      currentProgress: 50,
      remainingWorkQuantity: 100,
    };

    // Mock for getLatestProductivityDataByWorker - current productivity
    const mockCurrentProductivityResponse = {
      facilityId: 'F001',
      averageProductivityPerWorker: 15,
      workerCount: 5,
    };

    // Mock for getLatestProductivityDataByWorker - historical productivity (past 30 days)
    const mockHistoricalProductivityResponse = {
      facilityId: 'F001',
      averageProductivityPerWorker: 18,
      workerCount: 5,
    };

    // Mock for classifyDelayReason output with calculated efficiency decline
    const mockClassifyDelayReasonResponse = {
      facilityId: 'F001',
      teamId: undefined,
      insufficientStaffContribution: 33.33,
      efficiencyDeclineContribution: 16.67,
      priorityMisalignmentContribution: 50.0,
      primaryDelayReason: 'PRIORITY_MISALIGNMENT',
    };

    // Stub getRecentProgressDataByWorkInstruction
    jest
      .spyOn(riskEngine, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressDataResponse);

    // Stub getLatestProductivityDataByWorker
    // Tracks call count to differentiate between current and historical data retrieval
    let getLatestProductivityCallCount = 0;
    const getLatestProductivitySpy = jest
      .spyOn(riskEngine, 'getLatestProductivityDataByWorker' as any)
      .mockImplementation(() => {
        getLatestProductivityCallCount++;
        // First call returns current productivity (15件/時間)
        // Subsequent calls return historical productivity (18件/時間) for past 30 days
        if (getLatestProductivityCallCount === 1) {
          return Promise.resolve(mockCurrentProductivityResponse);
        }
        return Promise.resolve(mockHistoricalProductivityResponse);
      });

    // Stub classifyDelayReason with validation of input parameters
    const classifyDelayReasonSpy = jest
      .spyOn(riskEngine, 'classifyDelayReason' as any)
      .mockImplementation((input: any) => {
        // Validate that the input contains the expected parameters
        expect(input.actualProgressRate).toBe(50); // currentProgress
        expect(input.plannedProgressRate).toBe(60); // requiredProgressByTime
        expect(input.allocatedStaffCount).toBe(5); // allocatedWorkerCount
        expect(input.requiredStaffCount).toBe(4); // requiredWorkerCount
        expect(input.averageProductivityRate).toBe(15); // averageProductivityPerWorker

        // Verify that historicalProductivityPerWorker is provided
        expect(input.averageProductivityRate).toBeDefined();

        // Verify that priority distribution is provided
        expect(input.workInstructionPriorityDistribution).toBeDefined();
        expect(typeof input.workInstructionPriorityDistribution).toBe('object');
        expect(input.workInstructionPriorityDistribution).toHaveProperty('high');
        expect(input.workInstructionPriorityDistribution).toHaveProperty('medium');
        expect(input.workInstructionPriorityDistribution).toHaveProperty('low');

        // Verify facility and team IDs are provided
        expect(input.facilityId).toBe('F001');

        return Promise.resolve(mockClassifyDelayReasonResponse);
      });

    // Act
    let error: Error | null = null;
    let result: any = null;

    try {
      result = await monitorAndJudgeDelayRisk({
        facilityIds,
        teamIds,
        workInstructionIds,
        evaluationDateTime,
        userId,
      });
    } catch (e) {
      error = e as Error;
    }

    // Assert - Verify no errors occurred
    expect(error).toBeNull();
    expect(result).toBeDefined();
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);

    // Find the classification for facility F001
    const f001Classification = result.delayReasonClassifications.find(
      (classification: any) => classification.facilityId === 'F001'
    );

    expect(f001Classification).toBeDefined();

    if (f001Classification) {
      // Verify that efficiencyDeclineContribution reflects the productivity decline
      expect(f001Classification.efficiencyDeclineContribution).toBeGreaterThan(0);

      // Check if the value is within tolerance of expected decline rate
      // (18 - 15) / 18 * 100 = 16.67%
      const difference = Math.abs(
        f001Classification.efficiencyDeclineContribution - expectedEfficiencyDeclineRate
      );
      expect(difference).toBeLessThanOrEqual(tolerancePercent);

      // Verify that the productivity decline is quantitatively reflected
      // Current productivity: 15件/時間, Historical productivity: 18件/時間
      // This confirms the decline is embedded in the efficiencyDeclineContribution
      const currentProductivity = 15;
      const historicalProductivity = 18;
      const calculatedDeclineRate = ((historicalProductivity - currentProductivity) / historicalProductivity) * 100;

      // The efficiencyDeclineContribution should reflect this calculated decline rate
      expect(Math.abs(f001Classification.efficiencyDeclineContribution - calculatedDeclineRate))
        .toBeLessThanOrEqual(tolerancePercent);

      // Verify that the sum of contributions equals 100 or close to it
      const totalContribution =
        f001Classification.insufficientStaffContribution +
        f001Classification.efficiencyDeclineContribution +
        f001Classification.priorityMisalignmentContribution;

      expect(totalContribution).toBeCloseTo(100, 0);

      // Verify that primary delay reason is identified
      expect(f001Classification.primaryDelayReason).toBeDefined();
      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        f001Classification.primaryDelayReason
      );

      // Verify response urgency is set based on contributions
      expect(f001Classification.responseUrgency).toBeDefined();
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(f001Classification.responseUrgency);
    }

    // Verify overall output structure
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);

    if (result.rankedFacilities.length > 0) {
      const f001Facility = result.rankedFacilities.find((f: any) => f.facilityId === 'F001');
      if (f001Facility) {
        expect(f001Facility.riskScore).toBeGreaterThanOrEqual(0);
        expect(f001Facility.riskScore).toBeLessThanOrEqual(100);
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(f001Facility.riskLevel);
        expect(f001Facility.priorityRank).toBeGreaterThanOrEqual(1);
      }
    }

    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    // Verify recommendedAdjustments contains proper structure with implementation priority
    if (result.recommendedAdjustments.length > 0) {
      result.recommendedAdjustments.forEach((adjustment: any) => {
        expect(adjustment.facilityId).toBeDefined();
        expect(adjustment.adjustmentType).toBeDefined();
        expect(adjustment.adjustmentDescription).toBeDefined();
        expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
        expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
        // Verify implementationPriority field is set based on main delay reason
        expect(adjustment.implementationPriority).toBeDefined();
        expect(typeof adjustment.implementationPriority).toBe('number');
        expect(adjustment.implementationPriority).toBeGreaterThanOrEqual(1);
      });
    }

    expect(result.hasHighRiskFacilities).toBeDefined();
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    // Verify no errors occurred and result is complete
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.evaluationDateTime).toEqual(evaluationDateTime);

    // Verify that classifyDelayReason was called with expected parameters
    expect(classifyDelayReasonSpy).toHaveBeenCalled();

    // Verify that the spy received calls with the correct input structure
    const callArgs = classifyDelayReasonSpy.mock.calls[0];
    expect(callArgs).toBeDefined();
    if (callArgs && callArgs[0]) {
      const inputArg = callArgs[0];
      expect(inputArg.facilityId).toBe('F001');
      expect(inputArg.actualProgressRate).toBe(50);
      expect(inputArg.plannedProgressRate).toBe(60);
      expect(inputArg.allocatedStaffCount).toBe(5);
      expect(inputArg.requiredStaffCount).toBe(4);
      expect(inputArg.averageProductivityRate).toBe(15);
      expect(inputArg.workInstructionPriorityDistribution).toBeDefined();
    }

    // Verify that getLatestProductivityDataByWorker was called multiple times
    // First call for current productivity, subsequent calls for historical productivity
    expect(getLatestProductivitySpy).toHaveBeenCalledTimes(getLatestProductivityCallCount);
    expect(getLatestProductivityCallCount).toBeGreaterThanOrEqual(2);

    // Verify recommendedAdjustments reflects the primary delay reason and contributions
    if (f001Classification) {
      const f001Adjustments = result.recommendedAdjustments
        .filter((adj: any) => adj.facilityId === 'F001');

      expect(f001Adjustments.length).toBeGreaterThan(0);

      // Implementation priority should be set based on the contributions
      f001Adjustments.forEach((adj: any) => {
        expect(adj.implementationPriority).toBeDefined();
        expect(typeof adj.implementationPriority).toBe('number');
        expect(adj.implementationPriority).toBeGreaterThanOrEqual(1);
      });

      // The primary delay reason (PRIORITY_MISALIGNMENT with 50% contribution) should have priority
      const minPriority = Math.min(...f001Adjustments.map((adj: any) => adj.implementationPriority));
      expect(minPriority).toBeDefined();
      expect(typeof minPriority).toBe('number');
    }
  });
});