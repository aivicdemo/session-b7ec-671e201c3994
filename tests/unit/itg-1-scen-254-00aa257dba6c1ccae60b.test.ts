import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

// Mock dependencies
jest.mock('../../src/data/repositories/progress-data.repository');
jest.mock('../../src/data/repositories/delay-risk-judgment.repository');
jest.mock('../../src/data/repositories/allocation-execution-status.repository');
jest.mock('../../src/data/repositories/handy-terminal-sync-log.repository');
jest.mock('../../src/data/repositories/work-instruction-reception-history.repository');
jest.mock('../../src/data/repositories/productivity-data.repository');
jest.mock('../../src/logic/validation.ts');

describe('SCEN-254: Dashboard Aggregation with Insufficient Productivity Data', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should warn when productivity data is insufficient and complete aggregation successfully', async () => {
    // Import mocked modules
    const progressRepo = require('../../src/data/repositories/progress-data.repository');
    const delayRiskRepo = require('../../src/data/repositories/delay-risk-judgment.repository');
    const allocationRepo = require('../../src/data/repositories/allocation-execution-status.repository');
    const handyTerminalRepo = require('../../src/data/repositories/handy-terminal-sync-log.repository');
    const receptionHistoryRepo = require('../../src/data/repositories/work-instruction-reception-history.repository');
    const productivityRepo = require('../../src/data/repositories/productivity-data.repository');
    const validation = require('../../src/logic/validation.ts');

    // Mock validate function
    validation.validateDateTimeRange = jest.fn().mockReturnValue(true);

    // Mock progress data - normal data
    const mockProgressData = [
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T12:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 80,
        completionRate: 80,
        delayFlag: false,
        delayDays: null
      }
    ];

    // Mock productivity data - EMPTY (insufficient)
    const mockProductivityData: any[] = [];

    // Mock delay risk judgment data
    const mockDelayRiskData = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        currentProgressRate: 80,
        plannedProgressRate: 75,
        delayReason: '',
        recommendedAction: '',
        actionStatus: 'completed',
        judgmentDateTime: '2024-01-01T12:00:00Z'
      }
    ];

    // Mock allocation execution status data
    const mockAllocationData = [
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: 'configured',
        plannedWorkHours: 8,
        actualWorkHours: 6,
        progressRate: 75,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T09:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
        actualStartDateTime: '2024-01-01T09:00:00Z',
        actualEndDateTime: null
      }
    ];

    // Mock handy terminal sync log data
    const mockHandyTerminalData = [
      {
        syncLogId: 'HL001',
        workerId: 'W001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncStatus: 'success',
        errorMessage: null,
        sendDateTime: '2024-01-01T12:00:00Z',
        receiveDateTime: '2024-01-01T12:00:01Z',
        processingCompleteDateTime: '2024-01-01T12:00:05Z'
      }
    ];

    // Mock improvement instruction delivery history
    const mockDeliveryHistoryData = [
      {
        deliveryHistoryId: 'DH001',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: 'Increase staffing',
        deliveryDateTime: '2024-01-01T11:00:00Z',
        deliveryStatus: 'delivered',
        recipientCount: 5,
        acknowledgedCount: 5
      }
    ];

    progressRepo.listProgressDataByCondition = jest.fn().mockResolvedValue(mockProgressData);
    productivityRepo.listProductivityDataByCondition = jest.fn().mockResolvedValue(mockProductivityData);
    delayRiskRepo.listDelayRiskJudgmentByCondition = jest.fn().mockResolvedValue(mockDelayRiskData);
    allocationRepo.listAllocationExecutionStatusByCondition = jest.fn().mockResolvedValue(mockAllocationData);
    handyTerminalRepo.listHandyTerminalSyncLogByCondition = jest.fn().mockResolvedValue(mockHandyTerminalData);
    receptionHistoryRepo.listWorkInstructionReceptionHistoryByCondition = jest.fn().mockResolvedValue(mockDeliveryHistoryData);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T09:00:00Z',
      aggregationEndDateTime: '2024-01-01T18:00:00Z',
      requestUserId: 'user-001'
    };

    const result = await aggregateDashboardData(input);

    // Verify warn was called with the expected message
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('生産性データが不足しています')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('推奨アクションの精度が低下する可能性があります')
    );

    // Verify output structure is valid
    expect(result).toBeDefined();
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');

    // Verify data aggregation is correct
    expect(result.progressByFacilityAndTeam.length).toBeGreaterThan(0);
    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    expect(result.allocationExecutionStatus.length).toBeGreaterThan(0);
  });
});