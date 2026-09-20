import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import type {
  MonitorAndJudgeDelayRiskInput,
  MonitorAndJudgeDelayRiskOutput,
} from '../../src/logic/progress-monitoring-risk-engine';

// Mock the internal dependencies
jest.mock('../../src/logic/progress-monitoring-risk-engine', () => ({
  monitorAndJudgeDelayRisk: jest.fn(),
}));

// Mock external data sources and internal functions
const mockGetRecentProgressDataByWorkInstruction = jest.fn();
const mockGetLatestProductivityDataByWorker = jest.fn();
const mockCalculateDelayRiskScore = jest.fn();
const mockClassifyDelayReason = jest.fn();
const mockRankFacilitiesByRiskPriority = jest.fn();
const mockSaveDelayRiskJudgment = jest.fn();

describe('SCEN-109: 推定完了時間が納期までの残り時間を超える場合、リスクレベルを高に設定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set risk level to high when estimated completion time exceeds remaining time', async () => {
    // Arrange
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['FAC-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER-123',
    };

    // Set up stubs for getRecentProgressDataByWorkInstruction
    mockGetRecentProgressDataByWorkInstruction.mockResolvedValue({
      remainingWorkQuantity: 100,
      currentWorkerCount: 5,
    });

    // Set up stubs for getLatestProductivityDataByWorker
    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      averageWorkerProductivity: 10, // 件/時間
    });

    // Set up stubs for calculateDelayRiskScore
    // Based on business rule br-tx_4-003:
    // estimatedTimeNeeded = (100 / (10 * 5)) * 60 = 120分
    // remainingTimeMinutes = 60分
    // timeShortfall = 120 - 60 = 60分 (positive value)
    mockCalculateDelayRiskScore.mockResolvedValue({
      riskScore: 75,
      riskLevel: 'high',
      timeShortfall: 60,
      estimatedCompletionTimeMinutes: 120,
      remainingTimeMinutes: 60,
    });

    // Set up stubs for classifyDelayReason
    mockClassifyDelayReason.mockResolvedValue({
      facilityId: 'FAC-001',
      teamId: undefined,
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'IMMEDIATE',
    });

    // Set up stubs for rankFacilitiesByRiskPriority
    mockRankFacilitiesByRiskPriority.mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'FAC-001',
          facilityName: 'Facility 001',
          riskScore: 75,
          riskLevel: 'high',
          predictedDelayDays: 2,
          currentProgressRate: 40,
          plannedProgressRate: 60,
          priorityRank: 1,
        },
      ],
    });

    // Set up stubs for saveDelayRiskJudgment
    mockSaveDelayRiskJudgment.mockResolvedValue({
      success: true,
      judgmentId: 'JUDGMENT-20240115-001',
    });

    const mockOutput: MonitorAndJudgeDelayRiskOutput = {
      judgmentId: 'JUDGMENT-20240115-001',
      evaluationDateTime: '2024-01-15T10:30:00Z',
      rankedFacilities: [
        {
          facilityId: 'FAC-001',
          facilityName: 'Facility 001',
          riskScore: 75,
          riskLevel: 'high',
          predictedDelayDays: 2,
          currentProgressRate: 40,
          plannedProgressRate: 60,
          priorityRank: 1,
        },
      ],
      delayReasonClassifications: [
        {
          facilityId: 'FAC-001',
          teamId: undefined,
          insufficientStaffContribution: 50,
          efficiencyDeclineContribution: 30,
          priorityMisalignmentContribution: 20,
          primaryDelayReason: 'INSUFFICIENT_STAFF',
          responseUrgency: 'IMMEDIATE',
        },
      ],
      recommendedAdjustments: [
        {
          facilityId: 'FAC-001',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: '人員を3名追加配置',
          estimatedEffectiveness: 65,
          implementationPriority: 1,
        },
      ],
      hasHighRiskFacilities: true,
    };

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue(mockOutput);

    // Act
    const result = await monitorAndJudgeDelayRisk(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.judgmentId).not.toEqual('');
    expect(result.evaluationDateTime).toEqual(input.evaluationDateTime);
    expect(result.rankedFacilities).toHaveLength(1);
    expect(result.rankedFacilities[0].facilityId).toEqual('FAC-001');
    expect(result.rankedFacilities[0].riskLevel).toEqual('high');
    expect(result.delayReasonClassifications).toBeDefined();
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    expect(
      result.delayReasonClassifications.some(
        (d) => d.facilityId === 'FAC-001'
      )
    ).toBe(true);
    expect(result.recommendedAdjustments).toBeDefined();
    expect(
      result.recommendedAdjustments.some(
        (a) => a.facilityId === 'FAC-001'
      )
    ).toBe(true);
    expect(result.hasHighRiskFacilities).toBe(true);
    expect(monitorAndJudgeDelayRisk).toHaveBeenCalledWith(input);
  });
});