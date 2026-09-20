import { aggregateDashboardData, AggregateDashboardDataInput, AggregateDashboardDataOutput, ProgressByFacilityAndTeamData } from '../../src/logic/dashboard-aggregation';

// Mock external dependencies
jest.mock('../../src/data/progress-repository', () => ({
  listProgressDataByCondition: jest.fn(),
}));

jest.mock('../../src/data/delay-risk-repository', () => ({
  getDelayRiskJudgmentResults: jest.fn(),
}));

jest.mock('../../src/data/allocation-repository', () => ({
  getAllocationExecutionStatus: jest.fn(),
}));

jest.mock('../../src/data/handy-terminal-repository', () => ({
  getHandyTerminalSyncLogs: jest.fn(),
}));

jest.mock('../../src/data/improvement-instruction-repository', () => ({
  getImprovementInstructionDeliveryHistory: jest.fn(),
}));

const mockListProgressDataByCondition = require('../../src/data/progress-repository').listProgressDataByCondition;
const mockGetDelayRiskJudgmentResults = require('../../src/data/delay-risk-repository').getDelayRiskJudgmentResults;
const mockGetAllocationExecutionStatus = require('../../src/data/allocation-repository').getAllocationExecutionStatus;
const mockGetHandyTerminalSyncLogs = require('../../src/data/handy-terminal-repository').getHandyTerminalSyncLogs;
const mockGetImprovementInstructionDeliveryHistory = require('../../src/data/improvement-instruction-repository').getImprovementInstructionDeliveryHistory;

describe('SCEN-255: aggregateDashboardData - 進捗データ集約とダッシュボード統合データ生成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate progress data by facility and team, and include ProgressByFacilityAndTeamData in output', async () => {
    // Arrange: テスト入力値を準備
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001', 'FAC002'],
      teamIds: ['TEAM-A', 'TEAM-B'],
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      requestUserId: 'USER123',
    };

    // Mock data for progress data
    const mockProgressData = [
      {
        progressDataId: 'PROG001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM-A',
        progressDate: '2024-01-01T12:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 80,
        completionRate: 80,
        delayFlag: false,
        delayDays: null,
      },
      {
        progressDataId: 'PROG002',
        workInstructionId: 'WI002',
        facilityId: 'FAC002',
        teamId: 'TEAM-B',
        progressDate: '2024-01-01T12:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 60,
        completionRate: 60,
        delayFlag: true,
        delayDays: 1,
      },
    ];

    // Mock facility and team mapping
    const facilityTeamMapping = [
      { facilityId: 'FAC001', facilityName: '東京拠点', teamId: 'TEAM-A', teamName: 'チームA' },
      { facilityId: 'FAC002', facilityName: '大阪拠点', teamId: 'TEAM-B', teamName: 'チームB' },
    ];

    // Mock allocation execution status
    const mockAllocationExecutionStatus = [
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'WRK001',
        facilityId: 'FAC001',
        teamId: 'TEAM-A',
        allocationState: '配置中',
        plannedWorkHours: 8,
        actualWorkHours: 6,
        progressRate: 75,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T08:00:00Z',
        plannedEndDateTime: '2024-01-01T16:00:00Z',
        actualStartDateTime: '2024-01-01T08:00:00Z',
        actualEndDateTime: null,
      },
    ];

    mockListProgressDataByCondition.mockResolvedValue(mockProgressData);
    mockGetDelayRiskJudgmentResults.mockResolvedValue([]);
    mockGetAllocationExecutionStatus.mockResolvedValue(mockAllocationExecutionStatus);
    mockGetHandyTerminalSyncLogs.mockResolvedValue([]);
    mockGetImprovementInstructionDeliveryHistory.mockResolvedValue([]);

    // Act: aggregateDashboardDataを呼び出す
    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    // Assert: 戻り値を検証
    expect(result).toBeDefined();
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);

    // Verify progressByFacilityAndTeamの各要素がProgressByFacilityAndTeamData型であることを確認
    result.progressByFacilityAndTeam.forEach((item: ProgressByFacilityAndTeamData) => {
      expect(item).toHaveProperty('facilityId');
      expect(item).toHaveProperty('facilityName');
      expect(item).toHaveProperty('teamId');
      expect(item).toHaveProperty('teamName');
      expect(item).toHaveProperty('completionRate');
      expect(item).toHaveProperty('delayFlag');
      expect(item).toHaveProperty('delayDays');
      expect(item).toHaveProperty('allocationEfficiency');
    });

    // Verify listProgressDataByConditionが正確に呼び出されたことを検証
    expect(mockListProgressDataByCondition).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['FAC001', 'FAC002'],
        teamIds: ['TEAM-A', 'TEAM-B'],
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-01T23:59:59Z',
      })
    );

    // Verify that progressByFacilityAndTeam contains data with expected structure
    expect(result.progressByFacilityAndTeam.length).toBeGreaterThan(0);

    // Check specific data content
    const fac001TeamA = result.progressByFacilityAndTeam.find(
      (p) => p.facilityId === 'FAC001' && p.teamId === 'TEAM-A'
    );
    if (fac001TeamA) {
      expect(fac001TeamA.completionRate).toBe(80);
      expect(fac001TeamA.delayFlag).toBe(false);
      expect(fac001TeamA.delayDays).toBeNull();
    }

    const fac002TeamB = result.progressByFacilityAndTeam.find(
      (p) => p.facilityId === 'FAC002' && p.teamId === 'TEAM-B'
    );
    if (fac002TeamB) {
      expect(fac002TeamB.completionRate).toBe(60);
      expect(fac002TeamB.delayFlag).toBe(true);
      expect(fac002TeamB.delayDays).toBe(1);
    }

    // Verify aggregationTimestamp is present
    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
  });

  it('should call listProgressDataByCondition with correct parameters', async () => {
    // Arrange
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: ['TEAM-A'],
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      requestUserId: 'USER123',
    };

    mockListProgressDataByCondition.mockResolvedValue([]);
    mockGetDelayRiskJudgmentResults.mockResolvedValue([]);
    mockGetAllocationExecutionStatus.mockResolvedValue([]);
    mockGetHandyTerminalSyncLogs.mockResolvedValue([]);
    mockGetImprovementInstructionDeliveryHistory.mockResolvedValue([]);

    // Act
    await aggregateDashboardData(input);

    // Assert
    expect(mockListProgressDataByCondition).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['FAC001'],
        teamIds: ['TEAM-A'],
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-01T23:59:59Z',
      })
    );
  });

  it('should include all required output fields in AggregateDashboardDataOutput', async () => {
    // Arrange
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: ['TEAM-A'],
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      requestUserId: 'USER123',
    };

    mockListProgressDataByCondition.mockResolvedValue([]);
    mockGetDelayRiskJudgmentResults.mockResolvedValue([]);
    mockGetAllocationExecutionStatus.mockResolvedValue([]);
    mockGetHandyTerminalSyncLogs.mockResolvedValue([]);
    mockGetImprovementInstructionDeliveryHistory.mockResolvedValue([]);

    // Act
    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    // Assert
    expect(result).toHaveProperty('progressByFacilityAndTeam');
    expect(result).toHaveProperty('delayRiskJudgmentResults');
    expect(result).toHaveProperty('allocationExecutionStatus');
    expect(result).toHaveProperty('handyTerminalSyncLog');
    expect(result).toHaveProperty('improvementInstructionDeliveryHistory');
    expect(result).toHaveProperty('aggregationTimestamp');

    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
  });
});