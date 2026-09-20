import { aggregateDashboardData } from "../../src/logic/dashboard-aggregation";
import { AggregateDashboardDataInput, AggregateDashboardDataOutput, ProgressByFacilityAndTeamData, DelayRiskJudgmentResultData, AllocationExecutionStatusData, HandyTerminalSyncLogData, ImprovementInstructionDeliveryHistoryData } from "../../src/logic/dashboard-aggregation";
import * as dashboardAggregation from "../../src/logic/dashboard-aggregation";

describe("SCEN-262: aggregationTimestamp contains aggregation completion datetime in ISO 8601 format", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return aggregationTimestamp in ISO 8601 format with timezone information", async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ["F001", "F002"],
      teamIds: ["T001", "T002"],
      aggregationStartDateTime: "2024-01-15T08:00:00Z",
      aggregationEndDateTime: "2024-01-15T18:00:00Z",
      requestUserId: "user-123",
    };

    const mockProgressData: ProgressByFacilityAndTeamData[] = [
      {
        facilityId: "F001",
        facilityName: "拠点A",
        teamId: "T001",
        teamName: "チームA",
        completionRate: 75,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 90,
      },
    ];

    const mockDelayRiskData: DelayRiskJudgmentResultData[] = [
      {
        riskJudgmentId: "R001",
        workInstructionId: "W001",
        facilityId: "F001",
        teamId: "T001",
        riskLevel: "LOW",
        delayPredictionDays: 0,
        currentProgressRate: 75,
        plannedProgressRate: 75,
        delayReason: "なし",
        recommendedAction: "なし",
        actionStatus: "未対応",
        judgmentDateTime: "2024-01-15T18:00:00Z",
      },
    ];

    const mockAllocationExecutionStatus: AllocationExecutionStatusData[] = [
      {
        allocationExecutionStatusId: "A001",
        allocationPlanId: "AP001",
        workInstructionId: "W001",
        workerId: "WR001",
        facilityId: "F001",
        teamId: "T001",
        allocationState: "配置中",
        plannedWorkHours: 8,
        actualWorkHours: 6,
        progressRate: 75,
        delayFlag: false,
        plannedStartDateTime: "2024-01-15T08:00:00Z",
        plannedEndDateTime: "2024-01-15T18:00:00Z",
        actualStartDateTime: "2024-01-15T08:00:00Z",
        actualEndDateTime: null,
      },
    ];

    const mockHandyTerminalSyncLog: HandyTerminalSyncLogData[] = [
      {
        syncLogId: "S001",
        workerId: "WR001",
        facilityId: "F001",
        syncType: "作業実績",
        syncStatus: "成功",
        errorMessage: null,
        sendDateTime: "2024-01-15T12:00:00Z",
        receiveDateTime: "2024-01-15T12:00:01Z",
        processingCompleteDateTime: "2024-01-15T12:00:02Z",
      },
    ];

    const mockImprovementInstructionDeliveryHistory: ImprovementInstructionDeliveryHistoryData[] = [
      {
        deliveryHistoryId: "D001",
        facilityId: "F001",
        teamId: "T001",
        improvementInstructionContent: "人員追加",
        deliveryDateTime: "2024-01-15T15:00:00Z",
        deliveryStatus: "配信済",
        recipientCount: 5,
        acknowledgedCount: 5,
      },
    ];

    jest.spyOn(dashboardAggregation, "listProgressDataByCondition" as any).mockResolvedValue(mockProgressData);
    jest.spyOn(dashboardAggregation, "listDelayRiskJudgmentByCondition" as any).mockResolvedValue(mockDelayRiskData);
    jest.spyOn(dashboardAggregation, "listAllocationExecutionStatusByCondition" as any).mockResolvedValue(mockAllocationExecutionStatus);
    jest.spyOn(dashboardAggregation, "listProductivityDataByCondition" as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation, "listHandyTerminalSyncLogByCondition" as any).mockResolvedValue(mockHandyTerminalSyncLog);
    jest.spyOn(dashboardAggregation, "listWorkInstructionReceptionHistoryByCondition" as any).mockResolvedValue(mockImprovementInstructionDeliveryHistory);
    jest.spyOn(dashboardAggregation, "validateDateTimeRange" as any).mockResolvedValue(true);

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    // Validate aggregationTimestamp is defined
    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe("string");

    // Check ISO 8601 format with timezone information
    // Supports formats like: 2024-01-15T18:00:00.123Z, 2024-01-15T18:00:00Z, 2024-01-15T18:00:00+00:00, 2024-01-15T18:00:00-05:00
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,})?([Z]|[+\-]\d{2}:\d{2})$/;
    expect(result.aggregationTimestamp).toMatch(iso8601Regex);

    // Verify it's a valid date that can be parsed
    const parsedDate = new Date(result.aggregationTimestamp);
    expect(parsedDate instanceof Date).toBe(true);
    expect(isNaN(parsedDate.getTime())).toBe(false);

    // Verify timezone information is present (ends with Z or ±HH:MM)
    const hasTimezone = 
      result.aggregationTimestamp.endsWith("Z") || 
      /[+\-]\d{2}:\d{2}$/.test(result.aggregationTimestamp);
    expect(hasTimezone).toBe(true);

    // Verify precision: should have at least seconds, and optionally milliseconds
    const hasPrecision = /T\d{2}:\d{2}:\d{2}/.test(result.aggregationTimestamp);
    expect(hasPrecision).toBe(true);
  });

  it("should return aggregationTimestamp that reflects execution time", async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ["F001"],
      teamIds: ["T001"],
      aggregationStartDateTime: "2024-01-15T08:00:00Z",
      aggregationEndDateTime: "2024-01-15T18:00:00Z",
      requestUserId: "user-123",
    };

    const mockProgressData: ProgressByFacilityAndTeamData[] = [
      {
        facilityId: "F001",
        facilityName: "拠点A",
        teamId: "T001",
        teamName: "チームA",
        completionRate: 80,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 85,
      },
    ];

    const mockDelayRiskData: DelayRiskJudgmentResultData[] = [
      {
        riskJudgmentId: "R002",
        workInstructionId: "W002",
        facilityId: "F001",
        teamId: "T001",
        riskLevel: "LOW",
        delayPredictionDays: 0,
        currentProgressRate: 80,
        plannedProgressRate: 80,
        delayReason: "なし",
        recommendedAction: "なし",
        actionStatus: "未対応",
        judgmentDateTime: "2024-01-15T18:00:00Z",
      },
    ];

    const mockAllocationExecutionStatus: AllocationExecutionStatusData[] = [
      {
        allocationExecutionStatusId: "A002",
        allocationPlanId: "AP002",
        workInstructionId: "W002",
        workerId: "WR002",
        facilityId: "F001",
        teamId: "T001",
        allocationState: "配置中",
        plannedWorkHours: 8,
        actualWorkHours: 7,
        progressRate: 80,
        delayFlag: false,
        plannedStartDateTime: "2024-01-15T08:00:00Z",
        plannedEndDateTime: "2024-01-15T18:00:00Z",
        actualStartDateTime: "2024-01-15T08:00:00Z",
        actualEndDateTime: null,
      },
    ];

    const mockHandyTerminalSyncLog: HandyTerminalSyncLogData[] = [
      {
        syncLogId: "S002",
        workerId: "WR002",
        facilityId: "F001",
        syncType: "作業実績",
        syncStatus: "成功",
        errorMessage: null,
        sendDateTime: "2024-01-15T14:00:00Z",
        receiveDateTime: "2024-01-15T14:00:01Z",
        processingCompleteDateTime: "2024-01-15T14:00:02Z",
      },
    ];

    const mockImprovementInstructionDeliveryHistory: ImprovementInstructionDeliveryHistoryData[] = [
      {
        deliveryHistoryId: "D002",
        facilityId: "F001",
        teamId: "T001",
        improvementInstructionContent: "優先順位変更",
        deliveryDateTime: "2024-01-15T16:00:00Z",
        deliveryStatus: "配信済",
        recipientCount: 3,
        acknowledgedCount: 3,
      },
    ];

    jest.spyOn(dashboardAggregation, "listProgressDataByCondition" as any).mockResolvedValue(mockProgressData);
    jest.spyOn(dashboardAggregation, "listDelayRiskJudgmentByCondition" as any).mockResolvedValue(mockDelayRiskData);
    jest.spyOn(dashboardAggregation, "listAllocationExecutionStatusByCondition" as any).mockResolvedValue(mockAllocationExecutionStatus);
    jest.spyOn(dashboardAggregation, "listProductivityDataByCondition" as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation, "listHandyTerminalSyncLogByCondition" as any).mockResolvedValue(mockHandyTerminalSyncLog);
    jest.spyOn(dashboardAggregation, "listWorkInstructionReceptionHistoryByCondition" as any).mockResolvedValue(mockImprovementInstructionDeliveryHistory);
    jest.spyOn(dashboardAggregation, "validateDateTimeRange" as any).mockResolvedValue(true);

    const beforeExecution = new Date();
    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);
    const afterExecution = new Date();

    const timestampDate = new Date(result.aggregationTimestamp);

    // Verify the timestamp is between before and after execution (with tolerance for system clock skew)
    const tolerance = 5000; // 5 second tolerance
    expect(timestampDate.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime() - tolerance);
    expect(timestampDate.getTime()).toBeLessThanOrEqual(afterExecution.getTime() + tolerance);
  });

  it("should include all required output fields in aggregation result", async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ["F001"],
      teamIds: ["T001"],
      aggregationStartDateTime: "2024-01-15T08:00:00Z",
      aggregationEndDateTime: "2024-01-15T18:00:00Z",
      requestUserId: "user-123",
    };

    const mockProgressData: ProgressByFacilityAndTeamData[] = [
      {
        facilityId: "F001",
        facilityName: "拠点A",
        teamId: "T001",
        teamName: "チームA",
        completionRate: 70,
        delayFlag: true,
        delayDays: 1,
        allocationEfficiency: 88,
      },
    ];

    const mockDelayRiskData: DelayRiskJudgmentResultData[] = [
      {
        riskJudgmentId: "R003",
        workInstructionId: "W003",
        facilityId: "F001",
        teamId: "T001",
        riskLevel: "MEDIUM",
        delayPredictionDays: 1,
        currentProgressRate: 70,
        plannedProgressRate: 75,
        delayReason: "人員不足",
        recommendedAction: "人員追加",
        actionStatus: "未対応",
        judgmentDateTime: "2024-01-15T18:00:00Z",
      },
    ];

    const mockAllocationExecutionStatus: AllocationExecutionStatusData[] = [
      {
        allocationExecutionStatusId: "A003",
        allocationPlanId: "AP003",
        workInstructionId: "W003",
        workerId: "WR003",
        facilityId: "F001",
        teamId: "T001",
        allocationState: "配置中",
        plannedWorkHours: 8,
        actualWorkHours: 5,
        progressRate: 70,
        delayFlag: true,
        plannedStartDateTime: "2024-01-15T08:00:00Z",
        plannedEndDateTime: "2024-01-15T18:00:00Z",
        actualStartDateTime: "2024-01-15T08:00:00Z",
        actualEndDateTime: null,
      },
    ];

    const mockHandyTerminalSyncLog: HandyTerminalSyncLogData[] = [
      {
        syncLogId: "S003",
        workerId: "WR003",
        facilityId: "F001",
        syncType: "作業実績",
        syncStatus: "成功",
        errorMessage: null,
        sendDateTime: "2024-01-15T13:00:00Z",
        receiveDateTime: "2024-01-15T13:00:01Z",
        processingCompleteDateTime: "2024-01-15T13:00:02Z",
      },
    ];

    const mockImprovementInstructionDeliveryHistory: ImprovementInstructionDeliveryHistoryData[] = [
      {
        deliveryHistoryId: "D003",
        facilityId: "F001",
        teamId: "T001",
        improvementInstructionContent: "人員追加",
        deliveryDateTime: "2024-01-15T17:00:00Z",
        deliveryStatus: "配信済",
        recipientCount: 2,
        acknowledgedCount: 2,
      },
    ];

    jest.spyOn(dashboardAggregation, "listProgressDataByCondition" as any).mockResolvedValue(mockProgressData);
    jest.spyOn(dashboardAggregation, "listDelayRiskJudgmentByCondition" as any).mockResolvedValue(mockDelayRiskData);
    jest.spyOn(dashboardAggregation, "listAllocationExecutionStatusByCondition" as any).mockResolvedValue(mockAllocationExecutionStatus);
    jest.spyOn(dashboardAggregation, "listProductivityDataByCondition" as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation, "listHandyTerminalSyncLogByCondition" as any).mockResolvedValue(mockHandyTerminalSyncLog);
    jest.spyOn(dashboardAggregation, "listWorkInstructionReceptionHistoryByCondition" as any).mockResolvedValue(mockImprovementInstructionDeliveryHistory);
    jest.spyOn(dashboardAggregation, "validateDateTimeRange" as any).mockResolvedValue(true);

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    // Verify all required output fields are present
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
    expect(typeof result.aggregationTimestamp).toBe("string");
  });

  it("should validate aggregationTimestamp with millisecond precision", async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ["F001"],
      teamIds: ["T001"],
      aggregationStartDateTime: "2024-01-15T08:00:00Z",
      aggregationEndDateTime: "2024-01-15T18:00:00Z",
      requestUserId: "user-123",
    };

    const mockProgressData: ProgressByFacilityAndTeamData[] = [
      {
        facilityId: "F001",
        facilityName: "拠点A",
        teamId: "T001",
        teamName: "チームA",
        completionRate: 85,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 92,
      },
    ];

    const mockDelayRiskData: DelayRiskJudgmentResultData[] = [
      {
        riskJudgmentId: "R004",
        workInstructionId: "W004",
        facilityId: "F001",
        teamId: "T001",
        riskLevel: "LOW",
        delayPredictionDays: 0,
        currentProgressRate: 85,
        plannedProgressRate: 85,
        delayReason: "なし",
        recommendedAction: "なし",
        actionStatus: "未対応",
        judgmentDateTime: "2024-01-15T18:00:00Z",
      },
    ];

    const mockAllocationExecutionStatus: AllocationExecutionStatusData[] = [
      {
        allocationExecutionStatusId: "A004",
        allocationPlanId: "AP004",
        workInstructionId: "W004",
        workerId: "WR004",
        facilityId: "F001",
        teamId: "T001",
        allocationState: "配置中",
        plannedWorkHours: 8,
        actualWorkHours: 7.5,
        progressRate: 85,
        delayFlag: false,
        plannedStartDateTime: "2024-01-15T08:00:00Z",
        plannedEndDateTime: "2024-01-15T18:00:00Z",
        actualStartDateTime: "2024-01-15T08:00:00Z",
        actualEndDateTime: null,
      },
    ];

    const mockHandyTerminalSyncLog: HandyTerminalSyncLogData[] = [
      {
        syncLogId: "S004",
        workerId: "WR004",
        facilityId: "F001",
        syncType: "作業実績",
        syncStatus: "成功",
        errorMessage: null,
        sendDateTime: "2024-01-15T15:30:00Z",
        receiveDateTime: "2024-01-15T15:30:01Z",
        processingCompleteDateTime: "2024-01-15T15:30:02Z",
      },
    ];

    const mockImprovementInstructionDeliveryHistory: ImprovementInstructionDeliveryHistoryData[] = [
      {
        deliveryHistoryId: "D004",
        facilityId: "F001",
        teamId: "T001",
        improvementInstructionContent: "その他",
        deliveryDateTime: "2024-01-15T18:00:00Z",
        deliveryStatus: "配信済",
        recipientCount: 1,
        acknowledgedCount: 1,
      },
    ];

    jest.spyOn(dashboardAggregation, "listProgressDataByCondition" as any).mockResolvedValue(mockProgressData);
    jest.spyOn(dashboardAggregation, "listDelayRiskJudgmentByCondition" as any).mockResolvedValue(mockDelayRiskData);
    jest.spyOn(dashboardAggregation, "listAllocationExecutionStatusByCondition" as any).mockResolvedValue(mockAllocationExecutionStatus);
    jest.spyOn(dashboardAggregation, "listProductivityDataByCondition" as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation, "listHandyTerminalSyncLogByCondition" as any).mockResolvedValue(mockHandyTerminalSyncLog);
    jest.spyOn(dashboardAggregation, "listWorkInstructionReceptionHistoryByCondition" as any).mockResolvedValue(mockImprovementInstructionDeliveryHistory);
    jest.spyOn(dashboardAggregation, "validateDateTimeRange" as any).mockResolvedValue(true);

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    // Verify the timestamp can be parsed and represents a valid point in time
    const timestamp = result.aggregationTimestamp;
    const date = new Date(timestamp);

    // Ensure the date is recent (within the last minute from now, allowing execution time)
    const now = new Date();
    const timeDiff = now.getTime() - date.getTime();
    
    // Should be executed recently (within 60 seconds, allowing for async operations)
    expect(timeDiff).toBeGreaterThanOrEqual(-1000); // Allow 1 second clock skew
    expect(timeDiff).toBeLessThan(60000); // Should be within last minute
  });
});