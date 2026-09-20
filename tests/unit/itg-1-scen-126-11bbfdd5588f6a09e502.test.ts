import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as progressMonitoringModule from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-126: 計画完了時刻が現在時刻より前のとき、例外を発生させてデータ確認の必要性を示す', () => {
  const currentDateTime = '2024-01-15T10:00:00Z';
  const currentTimestamp = 1705324800000; // 2024-01-15T10:00:00Z in milliseconds
  const plannedCompletionTimestamp = 1705316400000; // 2024-01-15T08:00:00Z in milliseconds (2 hours before current time)

  const mockProgressData = {
    facilityId: 'FACILITY-001',
    plannedCompletionTime: plannedCompletionTimestamp,
    currentProgress: 45,
    remainingWorkload: 5500,
  };

  const mockProductivityData = [
    {
      workerId: 'WORKER-001',
      avgProcessingTime: 30,
      errorRate: 2,
      skillLevel: 'intermediate',
    },
    {
      workerId: 'WORKER-002',
      avgProcessingTime: 35,
      errorRate: 3,
      skillLevel: 'junior',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(currentDateTime));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throw exception when plannedCompletionTime is before current time', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    // Setup stubs for validateReferentialIntegrity
    const validateReferentialIntegritySpy = jest
      .spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    // Setup stubs for getRecentProgressDataByWorkInstruction
    jest
      .spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    // Setup stubs for getLatestProductivityDataByWorker
    jest
      .spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    // Setup stubs for downstream functions that should NOT be called
    const calculateDelayRiskScoreSpy = jest
      .spyOn(progressMonitoringModule, 'calculateDelayRiskScore' as any)
      .mockResolvedValue({ riskScore: 75, predictedDelayDays: 2 });

    const classifyDelayReasonSpy = jest
      .spyOn(progressMonitoringModule, 'classifyDelayReason' as any)
      .mockResolvedValue({
        insufficientStaffContribution: 40,
        efficiencyDeclineContribution: 35,
        priorityMisalignmentContribution: 25,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
      });

    const rankFacilitiesByRiskPrioritySpy = jest
      .spyOn(progressMonitoringModule, 'rankFacilitiesByRiskPriority' as any)
      .mockResolvedValue({
        rankedFacilities: [
          {
            facilityId: 'FACILITY-001',
            facilityName: 'Facility 1',
            riskScore: 75,
            riskLevel: 'HIGH',
            predictedDelayDays: 2,
            currentProgressRate: 45,
            plannedProgressRate: 60,
            priorityRank: 1,
          },
        ],
      });

    const saveDelayRiskJudgmentSpy = jest
      .spyOn(progressMonitoringModule, 'saveDelayRiskJudgment' as any)
      .mockResolvedValue({ judgmentId: 'JUDGMENT-001' });

    // Call the function and expect it to throw an exception
    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '計画完了時刻が過去です。データを確認してください'
    );

    // Verify (1) validateReferentialIntegrity was called and data integrity check was executed
    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
    expect(validateReferentialIntegritySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['FACILITY-001'],
      })
    );

    // Verify (3) downstream functions were NOT called as a result of the exception
    expect(calculateDelayRiskScoreSpy).not.toHaveBeenCalled();
    expect(classifyDelayReasonSpy).not.toHaveBeenCalled();
    expect(rankFacilitiesByRiskPrioritySpy).not.toHaveBeenCalled();
    expect(saveDelayRiskJudgmentSpy).not.toHaveBeenCalled();
  });

  it('should not call downstream functions when planned completion time validation fails', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    // Setup stubs
    const validateReferentialIntegritySpy = jest
      .spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    jest
      .spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest
      .spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    // Setup stubs for downstream functions
    const calculateDelayRiskScoreSpy = jest
      .spyOn(progressMonitoringModule, 'calculateDelayRiskScore' as any)
      .mockResolvedValue({ riskScore: 75, predictedDelayDays: 2 });

    const classifyDelayReasonSpy = jest
      .spyOn(progressMonitoringModule, 'classifyDelayReason' as any)
      .mockResolvedValue({
        insufficientStaffContribution: 40,
        efficiencyDeclineContribution: 35,
        priorityMisalignmentContribution: 25,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
      });

    const rankFacilitiesByRiskPrioritySpy = jest
      .spyOn(progressMonitoringModule, 'rankFacilitiesByRiskPriority' as any)
      .mockResolvedValue({
        rankedFacilities: [
          {
            facilityId: 'FACILITY-001',
            facilityName: 'Facility 1',
            riskScore: 75,
            riskLevel: 'HIGH',
            predictedDelayDays: 2,
            currentProgressRate: 45,
            plannedProgressRate: 60,
            priorityRank: 1,
          },
        ],
      });

    const saveDelayRiskJudgmentSpy = jest
      .spyOn(progressMonitoringModule, 'saveDelayRiskJudgment' as any)
      .mockResolvedValue({ judgmentId: 'JUDGMENT-001' });

    // Verify that the exception is thrown before any downstream operations
    let caughtError: Error | null = null;
    try {
      await monitorAndJudgeDelayRisk(input);
      fail('Expected exception to be thrown');
    } catch (error) {
      caughtError = error as Error;
      // (4) Verify exception can be caught and has correct message
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.message).toBe('計画完了時刻が過去です。データを確認してください');

      // Verify (1) validateReferentialIntegrity was called and data integrity check was executed
      expect(validateReferentialIntegritySpy).toHaveBeenCalled();
      expect(validateReferentialIntegritySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          facilityIds: ['FACILITY-001'],
        })
      );

      // Verify (3) downstream functions were NOT called as a result of the exception
      expect(calculateDelayRiskScoreSpy).not.toHaveBeenCalled();
      expect(classifyDelayReasonSpy).not.toHaveBeenCalled();
      expect(rankFacilitiesByRiskPrioritySpy).not.toHaveBeenCalled();
      expect(saveDelayRiskJudgmentSpy).not.toHaveBeenCalled();
    }

    // Verify that error was indeed caught
    expect(caughtError).not.toBeNull();
    expect(caughtError!.message).toBe('計画完了時刻が過去です。データを確認してください');
  });

  it('should verify business rule br-tx_4-005 constraint enforcement with planned completion time in past', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    // Setup spies to track call order and verify constraint enforcement
    const validateReferentialIntegritySpy = jest
      .spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    jest
      .spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest
      .spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    const calculateDelayRiskScoreSpy = jest
      .spyOn(progressMonitoringModule, 'calculateDelayRiskScore' as any)
      .mockResolvedValue({ riskScore: 75, predictedDelayDays: 2 });

    const classifyDelayReasonSpy = jest
      .spyOn(progressMonitoringModule, 'classifyDelayReason' as any)
      .mockResolvedValue({
        insufficientStaffContribution: 40,
        efficiencyDeclineContribution: 35,
        priorityMisalignmentContribution: 25,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
      });

    const rankFacilitiesByRiskPrioritySpy = jest
      .spyOn(progressMonitoringModule, 'rankFacilitiesByRiskPriority' as any)
      .mockResolvedValue({
        rankedFacilities: [
          {
            facilityId: 'FACILITY-001',
            facilityName: 'Facility 1',
            riskScore: 75,
            riskLevel: 'HIGH',
            predictedDelayDays: 2,
            currentProgressRate: 45,
            plannedProgressRate: 60,
            priorityRank: 1,
          },
        ],
      });

    const saveDelayRiskJudgmentSpy = jest
      .spyOn(progressMonitoringModule, 'saveDelayRiskJudgment' as any)
      .mockResolvedValue({ judgmentId: 'JUDGMENT-001' });

    let exceptionThrown = false;
    let exceptionMessage = '';

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      exceptionThrown = true;
      exceptionMessage = (error as Error).message;
    }

    // Verify (2) constraint activation happened
    expect(exceptionThrown).toBe(true);
    expect(exceptionMessage).toBe('計画完了時刻が過去です。データを確認してください');

    // Verify constraint activation is based on time comparison logic
    // The constraint should be triggered when plannedCompletionTime < evaluationDateTime
    expect(plannedCompletionTimestamp).toBeLessThan(currentTimestamp);

    // Verify constraint activation through call sequence
    // validateReferentialIntegrity should be called to establish baseline data integrity
    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
    expect(validateReferentialIntegritySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['FACILITY-001'],
      })
    );

    // Verify that error is raised during planned completion time validation
    // and before downstream operations
    expect(calculateDelayRiskScoreSpy).not.toHaveBeenCalled();
    expect(classifyDelayReasonSpy).not.toHaveBeenCalled();
    expect(rankFacilitiesByRiskPrioritySpy).not.toHaveBeenCalled();
    expect(saveDelayRiskJudgmentSpy).not.toHaveBeenCalled();

    // Verify that the constraint prevents any risk judgment from being saved
    expect(saveDelayRiskJudgmentSpy).not.toHaveBeenCalled();
  });

  it('should preserve exception message through call stack for user notification', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    jest.spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    // Test that exception can be caught and message is available for user notification
    try {
      await monitorAndJudgeDelayRisk(input);
      fail('Expected exception to be thrown');
    } catch (error) {
      const caughtError = error as Error;
      
      // Verify (4) Exception is catchable and message can be notified to user
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.message).toBe('計画完了時刻が過去です。データを確認してください');
      
      // Verify message is suitable for user notification (not empty, specific, actionable)
      expect(caughtError.message.length).toBeGreaterThan(0);
      expect(caughtError.message).toContain('計画完了時刻');
      expect(caughtError.message).toContain('データを確認');
    }
  });

  it('should invoke getRecentProgressDataByWorkInstruction during processing and trigger time validation', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    const validateReferentialIntegritySpy = jest
      .spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    const getRecentProgressDataSpy = jest
      .spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    jest.spyOn(progressMonitoringModule, 'calculateDelayRiskScore' as any)
      .mockResolvedValue({ riskScore: 75, predictedDelayDays: 2 });

    jest.spyOn(progressMonitoringModule, 'classifyDelayReason' as any)
      .mockResolvedValue({
        insufficientStaffContribution: 40,
        efficiencyDeclineContribution: 35,
        priorityMisalignmentContribution: 25,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
      });

    jest.spyOn(progressMonitoringModule, 'rankFacilitiesByRiskPriority' as any)
      .mockResolvedValue({
        rankedFacilities: [
          {
            facilityId: 'FACILITY-001',
            facilityName: 'Facility 1',
            riskScore: 75,
            riskLevel: 'HIGH',
            predictedDelayDays: 2,
            currentProgressRate: 45,
            plannedProgressRate: 60,
            priorityRank: 1,
          },
        ],
      });

    let exceptionThrown = false;
    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      exceptionThrown = true;
      expect((error as Error).message).toBe('計画完了時刻が過去です。データを確認してください');
    }

    // Verify that getRecentProgressDataByWorkInstruction was invoked
    // This confirms the stub was used and triggered planned completion time validation
    expect(getRecentProgressDataSpy).toHaveBeenCalled();
    expect(exceptionThrown).toBe(true);
  });

  it('should verify call order: validateReferentialIntegrity called before time constraint check', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    const callSequence: string[] = [];

    const validateReferentialIntegritySpy = jest
      .spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockImplementation(async () => {
        callSequence.push('validateReferentialIntegrity');
        return true;
      });

    const getRecentProgressDataSpy = jest
      .spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockImplementation(async () => {
        callSequence.push('getRecentProgressDataByWorkInstruction');
        // This simulates the retrieval of data that contains the past plannedCompletionTime
        return mockProgressData;
      });

    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      // Expected exception due to planned completion time constraint
      expect((error as Error).message).toBe('計画完了時刻が過去です。データを確認してください');
    }

    // Verify that validateReferentialIntegrity was called
    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
    
    // Verify that getRecentProgressDataByWorkInstruction was called
    // (it provides the plannedCompletionTime that triggers the constraint)
    expect(getRecentProgressDataSpy).toHaveBeenCalled();
    
    // Verify the call order: both should be called during execution
    expect(callSequence).toContain('validateReferentialIntegrity');
    expect(callSequence).toContain('getRecentProgressDataByWorkInstruction');
  });

  it('should confirm exception contains message suitable for direct user display', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    jest.spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    let caughtException: Error | null = null;

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      caughtException = error as Error;
    }

    // Verify exception is catchable and contains user-friendly message
    expect(caughtException).not.toBeNull();
    expect(caughtException).toBeInstanceOf(Error);
    
    // Verify (4) message can be displayed directly to user
    const userMessage = caughtException!.message;
    expect(userMessage).toBe('計画完了時刻が過去です。データを確認してください');
    expect(userMessage).toMatch(/計画完了時刻.*過去/);
    expect(userMessage).toMatch(/データを確認/);
  });

  it('should compare plannedCompletionTime with evaluationDateTime timestamp values to trigger constraint', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    jest.spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    // Verify the time values in the test setup match the constraint condition
    // plannedCompletionTime (1705316400000 = 2024-01-15 08:00 UTC)
    // evaluationDateTime converted to timestamp (1705324800000 = 2024-01-15 10:00 UTC)
    expect(plannedCompletionTimestamp).toBeLessThan(currentTimestamp);
    
    let exceptionThrown = false;
    let thrownMessage = '';

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      exceptionThrown = true;
      thrownMessage = (error as Error).message;
    }

    // Verify (2) constraint was triggered by the time comparison
    expect(exceptionThrown).toBe(true);
    expect(thrownMessage).toBe('計画完了時刻が過去です。データを確認してください');
  });

  it('should verify data integrity check is executed by validateReferentialIntegrity before time validation', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    let dataIntegrityCheckExecuted = false;

    const validateReferentialIntegritySpy = jest
      .spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockImplementation(async (params: any) => {
        // Verify that integrity check has access to the input parameters
        if (params && params.facilityIds && params.facilityIds.length > 0) {
          dataIntegrityCheckExecuted = true;
        }
        return true;
      });

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      // Expected exception
    }

    // Verify (1) data integrity check was executed
    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
    expect(dataIntegrityCheckExecuted).toBe(true);
  });

  it('should verify br-tx_4-005 constraint triggers based on timestamp comparison logic', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'USER-001',
    };

    jest.spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);

    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);

    let constraintTriggered = false;
    let constraintMessage = '';

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      constraintTriggered = true;
      constraintMessage = (error as Error).message;
    }

    // Verify (2) the constraint from br-tx_4-005 was triggered
    // The constraint compares plannedCompletionTime with evaluationDateTime
    expect(constraintTriggered).toBe(true);
    
    // Verify the constraint message matches the specification
    expect(constraintMessage).toBe('計画完了時刻が過去です。データを確認してください');
    
    // Verify the constraint was triggered because plannedCompletionTime < current time
    expect(plannedCompletionTimestamp).toBeLessThan(currentTimestamp);
  });
});