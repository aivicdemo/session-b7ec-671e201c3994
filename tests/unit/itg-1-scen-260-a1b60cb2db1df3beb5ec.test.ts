import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

describe('SCEN-260: aggregateDashboardData - ImprovementInstructionDeliveryHistory transformation', () => {
  let mockValidateDateTimeRange: jest.Mock;
  let mockListProgressDataByCondition: jest.Mock;
  let mockListDelayRiskJudgmentByCondition: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockListHandyTerminalSyncLogByCondition: jest.Mock;
  let mockListWorkInstructionReceptionHistoryByCondition: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateDateTimeRange = jest.fn(() => ({ valid: true }));
    mockListProgressDataByCondition = jest.fn(() => [
      {
        facilityId: 'F001',
        facilityName: 'Tokyo Plant',
        teamId: 'T001',
        teamName: 'Team A',
        completionRate: 75,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 85,
      },
    ]);
    mockListDelayRiskJudgmentByCondition = jest.fn(() => [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 2,
        currentProgressRate: 70,
        plannedProgressRate: 75,
        delayReason: 'Efficiency low down',
        recommendedAction: 'Add staff',
        actionStatus: 'Under consideration',
        judgmentDateTime: '2024-01-15T10:00:00Z',
      },
    ]);
    mockListAllocationExecutionStatusByCondition = jest.fn(() => [
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: 'Assigned',
        plannedWorkHours: 8,
        actualWorkHours: 6,
        progressRate: 75,
        delayFlag: false,
        plannedStartDateTime: '2024-01-10T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        actualStartDateTime: '2024-01-10T09:00:00Z',
        actualEndDateTime: null,
      },
    ]);
    mockListProductivityDataByCondition = jest.fn(() => []);
    mockListHandyTerminalSyncLogByCondition = jest.fn(() => [
      {
        syncLogId: 'SL001',
        workerId: 'W001',
        facilityId: 'F001',
        syncType: 'Work Result',
        syncStatus: 'Success',
        errorMessage: null,
        sendDateTime: '2024-01-15T10:30:00Z',
        receiveDateTime: '2024-01-15T10:31:00Z',
        processingCompleteDateTime: '2024-01-15T10:32:00Z',
      },
    ]);

    const improvementHistoryRecords = [
      {
        deliveryHistoryId: 'DH001',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: 'Add 2 more workers',
        deliveryDateTime: '2024-01-15T11:00:00Z',
        deliveryStatus: 'Delivered',
        recipientCount: 5,
        acknowledgedCount: 4,
      },
      {
        deliveryHistoryId: 'DH002',
        facilityId: 'F001',
        teamId: null,
        improvementInstructionContent: 'Adjust priority order',
        deliveryDateTime: '2024-01-16T09:30:00Z',
        deliveryStatus: 'Acknowledged',
        recipientCount: 10,
        acknowledgedCount: 10,
      },
      {
        deliveryHistoryId: 'DH003',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: 'Optimize scheduling',
        deliveryDateTime: '2024-01-17T14:00:00Z',
        deliveryStatus: 'In progress',
        recipientCount: 3,
        acknowledgedCount: 2,
      },
    ];

    mockListWorkInstructionReceptionHistoryByCondition = jest.fn(
      () => improvementHistoryRecords
    );
  });

  it('should aggregate dashboard data with ImprovementInstructionDeliveryHistory records transformed correctly', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    jest.spyOn(global, 'Date').mockImplementation(() => new Date('2024-01-20T12:00:00Z'));

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    expect(result).toBeDefined();
    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(result.improvementInstructionDeliveryHistory.length).toBe(3);
  });

  it('should transform each improvement instruction delivery history record with required fields', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    result.improvementInstructionDeliveryHistory.forEach((record) => {
      expect(record.deliveryHistoryId).toBeDefined();
      expect(typeof record.deliveryHistoryId).toBe('string');

      expect(record.facilityId).toBeDefined();
      expect(typeof record.facilityId).toBe('string');

      expect(record.teamId === null || record.teamId === undefined || typeof record.teamId === 'string').toBe(true);

      expect(record.improvementInstructionContent).toBeDefined();
      expect(typeof record.improvementInstructionContent).toBe('string');

      expect(record.deliveryDateTime).toBeDefined();
      expect(typeof record.deliveryDateTime).toBe('string');

      expect(record.deliveryStatus).toBeDefined();
      expect(typeof record.deliveryStatus).toBe('string');

      expect(record.recipientCount).toBeDefined();
      expect(typeof record.recipientCount).toBe('number');

      expect(record.acknowledgedCount).toBeDefined();
      expect(typeof record.acknowledgedCount).toBe('number');
    });
  });

  it('should match the number of returned delivery history records with source data', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    const sourceRecords = mockListWorkInstructionReceptionHistoryByCondition();
    expect(result.improvementInstructionDeliveryHistory.length).toBe(
      sourceRecords.length
    );
  });

  it('should include all other aggregated data fields in the output', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(result.progressByFacilityAndTeam).not.toBeNull();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(result.delayRiskJudgmentResults).not.toBeNull();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);

    expect(result.allocationExecutionStatus).toBeDefined();
    expect(result.allocationExecutionStatus).not.toBeNull();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(result.handyTerminalSyncLog).not.toBeNull();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
  });

  it('should set aggregationTimestamp in ISO 8601 format', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.aggregationTimestamp)).toBe(true);
  });

  it('should call listWorkInstructionReceptionHistoryByCondition with correct parameters', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    expect(mockListWorkInstructionReceptionHistoryByCondition).toHaveBeenCalled();
    const callArgs = mockListWorkInstructionReceptionHistoryByCondition.mock.calls[0];
    if (callArgs) {
      expect(callArgs[0]).toContain('F001');
      expect(callArgs[1]).toBe('2024-01-01T00:00:00Z');
      expect(callArgs[2]).toBe('2024-01-31T23:59:59Z');
    }
  });

  it('should handle empty improvement instruction delivery history gracefully', async () => {
    mockListWorkInstructionReceptionHistoryByCondition.mockReturnValue([]);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(result.improvementInstructionDeliveryHistory.length).toBe(0);
  });

  it('should preserve teamId as null when delivery is facility-wide', async () => {
    mockListWorkInstructionReceptionHistoryByCondition.mockReturnValue([
      {
        deliveryHistoryId: 'DH004',
        facilityId: 'F001',
        teamId: null,
        improvementInstructionContent: 'Facility-wide instruction',
        deliveryDateTime: '2024-01-18T10:00:00Z',
        deliveryStatus: 'Delivered',
        recipientCount: 50,
        acknowledgedCount: 45,
      },
    ]);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    expect(result.improvementInstructionDeliveryHistory[0].teamId).toBeNull();
  });

  it('should preserve teamId as string when delivery is team-specific', async () => {
    mockListWorkInstructionReceptionHistoryByCondition.mockReturnValue([
      {
        deliveryHistoryId: 'DH005',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: 'Team-specific instruction',
        deliveryDateTime: '2024-01-18T10:00:00Z',
        deliveryStatus: 'Delivered',
        recipientCount: 10,
        acknowledgedCount: 10,
      },
    ]);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-001',
    };

    const result = await aggregateDashboardData(input, {
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition:
        mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition:
        mockListWorkInstructionReceptionHistoryByCondition,
    });

    expect(result.improvementInstructionDeliveryHistory[0].teamId).toBe('T001');
  });
});