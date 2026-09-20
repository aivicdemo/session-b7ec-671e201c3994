import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as progressMonitoringModule from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-124: 拠点の進捗データが欠落しているとき、警告を記録して最新データの確認を促す', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should return output with warning message associated to rankedFacilities element when facility progress data is incomplete', async () => {
    // Stub getRecentProgressDataByWorkInstruction to return incomplete progress data
    jest.spyOn(progressMonitoringModule as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      {
        workInstructionId: 'wi-001',
        facilityId: 'facility-A',
        currentProgress: null, // incomplete data
        plannedProgress: 80,
        remainingWorkDays: 2,
      },
      {
        workInstructionId: 'wi-002',
        facilityId: 'facility-A',
        currentProgress: 75,
        plannedProgress: 85,
        remainingWorkDays: 3,
      },
    ]);

    // Stub getLatestProductivityDataByWorker to return 5 workers' productivity data
    jest.spyOn(progressMonitoringModule as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      { workerId: 'worker-001', facilityId: 'facility-A', productivityRate: 85, qualityScore: 90 },
      { workerId: 'worker-002', facilityId: 'facility-A', productivityRate: 82, qualityScore: 88 },
      { workerId: 'worker-003', facilityId: 'facility-A', productivityRate: 78, qualityScore: 85 },
      { workerId: 'worker-004', facilityId: 'facility-A', productivityRate: 80, qualityScore: 87 },
      { workerId: 'worker-005', facilityId: 'facility-A', productivityRate: 83, qualityScore: 89 },
    ]);

    // Stub validateReferentialIntegrity to confirm integrity exists
    jest.spyOn(progressMonitoringModule as any, 'validateReferentialIntegrity').mockResolvedValue(true);

    // Stub calculateRiskScore to return risk score based on valid data
    jest.spyOn(progressMonitoringModule as any, 'calculateRiskScore').mockResolvedValue(65);

    // Stub classifyDelayReason to return normal classification result
    jest.spyOn(progressMonitoringModule as any, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'facility-A',
      insufficientStaffContribution: 40,
      efficiencyDeclineContribution: 35,
      priorityMisalignmentContribution: 25,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    });

    // Stub rankFacilitiesByRiskPriority to return normal ranking result with warning message
    jest.spyOn(progressMonitoringModule as any, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 65,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 2,
          currentProgressRate: 60,
          plannedProgressRate: 80,
          priorityRank: 1,
          dataQualityWarning: '進捗データが不完全です。最新データを確認してください',
        },
      ],
    });

    // Stub saveDelayRiskJudgment to save judgment result
    jest.spyOn(progressMonitoringModule as any, 'saveDelayRiskJudgment').mockResolvedValue('judgment-id-001');

    const input = {
      facilityIds: ['facility-A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user-001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.judgmentId).toBeTruthy();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.evaluationDateTime).toBe('2025-01-15T10:30:00Z');
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);

    const facilityARecord = result.rankedFacilities.find(f => f.facilityId === 'facility-A');
    expect(facilityARecord).toBeDefined();
    
    // Verify warning message is associated to the facility element (br-tx_4-005 constraint)
    expect(facilityARecord).toHaveProperty('dataQualityWarning');
    expect(facilityARecord!.dataQualityWarning).toContain('進捗データが不完全です');
    expect(facilityARecord!.dataQualityWarning).toContain('最新データを確認してください');

    // Verify warning log was also output to console
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('進捗データが不完全です')
    );

    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
  });

  it('should not throw ProgressDataNotAvailableError when progress data is incomplete', async () => {
    jest.spyOn(progressMonitoringModule as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      { workInstructionId: 'wi-001', facilityId: 'facility-A', currentProgress: null, plannedProgress: 80 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      { workerId: 'worker-001', facilityId: 'facility-A', productivityRate: 85, qualityScore: 90 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressMonitoringModule as any, 'calculateRiskScore').mockResolvedValue(60);
    jest.spyOn(progressMonitoringModule as any, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'facility-A',
      insufficientStaffContribution: 40,
      efficiencyDeclineContribution: 35,
      priorityMisalignmentContribution: 25,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
    });
    jest.spyOn(progressMonitoringModule as any, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 60,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 1,
          currentProgressRate: 65,
          plannedProgressRate: 80,
          priorityRank: 1,
          dataQualityWarning: '進捗データが不完全です。最新データを確認してください',
        },
      ],
    });
    jest.spyOn(progressMonitoringModule as any, 'saveDelayRiskJudgment').mockResolvedValue('judgment-id-002');

    const input = {
      facilityIds: ['facility-A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user-001',
    };

    const executionFn = async () => {
      return await monitorAndJudgeDelayRisk(input);
    };

    await expect(executionFn()).resolves.not.toThrow();

    // Verify warning log was output
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should include facility-A in rankedFacilities even with incomplete data', async () => {
    jest.spyOn(progressMonitoringModule as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      { workInstructionId: 'wi-001', facilityId: 'facility-A', currentProgress: null, plannedProgress: 80 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      { workerId: 'worker-001', facilityId: 'facility-A', productivityRate: 85, qualityScore: 90 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressMonitoringModule as any, 'calculateRiskScore').mockResolvedValue(60);
    jest.spyOn(progressMonitoringModule as any, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'facility-A',
      insufficientStaffContribution: 40,
      efficiencyDeclineContribution: 35,
      priorityMisalignmentContribution: 25,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
    });
    jest.spyOn(progressMonitoringModule as any, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 60,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 1,
          currentProgressRate: 65,
          plannedProgressRate: 80,
          priorityRank: 1,
          dataQualityWarning: '進捗データが不完全です。最新データを確認してください',
        },
      ],
    });
    jest.spyOn(progressMonitoringModule as any, 'saveDelayRiskJudgment').mockResolvedValue('judgment-id-003');

    const input = {
      facilityIds: ['facility-A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user-001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    const facilityAFound = result.rankedFacilities.some(f => f.facilityId === 'facility-A');
    expect(facilityAFound).toBe(true);

    const facilityARecord = result.rankedFacilities.find(f => f.facilityId === 'facility-A');
    expect(facilityARecord).toHaveProperty('dataQualityWarning');

    // Verify warning log was output
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should return valid structure with generated judgmentId and input evaluationDateTime', async () => {
    jest.spyOn(progressMonitoringModule as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      { workInstructionId: 'wi-001', facilityId: 'facility-A', currentProgress: 70, plannedProgress: 80 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      { workerId: 'worker-001', facilityId: 'facility-A', productivityRate: 85, qualityScore: 90 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressMonitoringModule as any, 'calculateRiskScore').mockResolvedValue(45);
    jest.spyOn(progressMonitoringModule as any, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'facility-A',
      insufficientStaffContribution: 30,
      efficiencyDeclineContribution: 40,
      priorityMisalignmentContribution: 30,
      primaryDelayReason: 'EFFICIENCY_DECLINE',
    });
    jest.spyOn(progressMonitoringModule as any, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 45,
          riskLevel: 'LOW',
          predictedDelayDays: 0,
          currentProgressRate: 70,
          plannedProgressRate: 80,
          priorityRank: 1,
        },
      ],
    });
    jest.spyOn(progressMonitoringModule as any, 'saveDelayRiskJudgment').mockResolvedValue('judgment-id-004');

    const input = {
      facilityIds: ['facility-A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user-001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.judgmentId).toBeTruthy();
    expect(result.judgmentId.length).toBeGreaterThan(0);
    expect(result.evaluationDateTime).toBe(input.evaluationDateTime);
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
  });

  it('should return arrays for delayReasonClassifications and recommendedAdjustments', async () => {
    jest.spyOn(progressMonitoringModule as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      { workInstructionId: 'wi-001', facilityId: 'facility-A', currentProgress: 70, plannedProgress: 80 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      { workerId: 'worker-001', facilityId: 'facility-A', productivityRate: 85, qualityScore: 90 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressMonitoringModule as any, 'calculateRiskScore').mockResolvedValue(50);
    jest.spyOn(progressMonitoringModule as any, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'facility-A',
      insufficientStaffContribution: 35,
      efficiencyDeclineContribution: 38,
      priorityMisalignmentContribution: 27,
      primaryDelayReason: 'EFFICIENCY_DECLINE',
    });
    jest.spyOn(progressMonitoringModule as any, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 50,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 1,
          currentProgressRate: 70,
          plannedProgressRate: 80,
          priorityRank: 1,
        },
      ],
    });
    jest.spyOn(progressMonitoringModule as any, 'saveDelayRiskJudgment').mockResolvedValue('judgment-id-005');

    const input = {
      facilityIds: ['facility-A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user-001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
  });

  it('should log warning with constraint br-tx_4-005 when progress data is incomplete', async () => {
    jest.spyOn(progressMonitoringModule as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      { workInstructionId: 'wi-001', facilityId: 'facility-A', currentProgress: null, plannedProgress: 80 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      { workerId: 'worker-001', facilityId: 'facility-A', productivityRate: 85, qualityScore: 90 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressMonitoringModule as any, 'calculateRiskScore').mockResolvedValue(55);
    jest.spyOn(progressMonitoringModule as any, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'facility-A',
      insufficientStaffContribution: 40,
      efficiencyDeclineContribution: 35,
      priorityMisalignmentContribution: 25,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
    });
    jest.spyOn(progressMonitoringModule as any, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 55,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 1,
          currentProgressRate: 60,
          plannedProgressRate: 80,
          priorityRank: 1,
          dataQualityWarning: '進捗データが不完全です。最新データを確認してください',
        },
      ],
    });
    jest.spyOn(progressMonitoringModule as any, 'saveDelayRiskJudgment').mockResolvedValue('judgment-id-006');

    const input = {
      facilityIds: ['facility-A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user-001',
    };

    await monitorAndJudgeDelayRisk(input);

    // Verify warning log is output per business rule br-tx_4-005
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/facility-A|拠点の進捗データが欠落|br-tx_4-005/)
    );
  });

  it('should attach warning message to rankedFacilities element that has incomplete data', async () => {
    jest.spyOn(progressMonitoringModule as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      { workInstructionId: 'wi-001', facilityId: 'facility-A', currentProgress: null, plannedProgress: 80 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      { workerId: 'worker-001', facilityId: 'facility-A', productivityRate: 85, qualityScore: 90 },
    ]);

    jest.spyOn(progressMonitoringModule as any, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressMonitoringModule as any, 'calculateRiskScore').mockResolvedValue(58);
    jest.spyOn(progressMonitoringModule as any, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'facility-A',
      insufficientStaffContribution: 40,
      efficiencyDeclineContribution: 35,
      priorityMisalignmentContribution: 25,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
    });
    jest.spyOn(progressMonitoringModule as any, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 58,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 2,
          currentProgressRate: 62,
          plannedProgressRate: 80,
          priorityRank: 1,
          dataQualityWarning: '進捗データが不完全です。最新データを確認してください',
        },
      ],
    });
    jest.spyOn(progressMonitoringModule as any, 'saveDelayRiskJudgment').mockResolvedValue('judgment-id-007');

    const input = {
      facilityIds: ['facility-A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user-001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    const facilityARecord = result.rankedFacilities.find(f => f.facilityId === 'facility-A');
    expect(facilityARecord).toBeDefined();
    expect(facilityARecord).toHaveProperty('dataQualityWarning');
    expect(facilityARecord!.dataQualityWarning).toBe('進捗データが不完全です。最新データを確認してください');
  });
});