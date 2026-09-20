import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

jest.mock('../../src/data/progress-data-repository');
jest.mock('../../src/data/productivity-data-repository');
jest.mock('../../src/data/facility-repository');
jest.mock('../../src/logic/validation');
jest.mock('../../src/logic/risk-calculation');
jest.mock('../../src/logic/adjustment-recommendation');
jest.mock('../../src/data/judgment-repository');

import * as progressDataRepository from '../../src/data/progress-data-repository';
import * as productivityDataRepository from '../../src/data/productivity-data-repository';
import * as facilityRepository from '../../src/data/facility-repository';
import * as validation from '../../src/logic/validation';
import * as riskCalculation from '../../src/logic/risk-calculation';
import * as adjustmentRecommendation from '../../src/logic/adjustment-recommendation';
import * as judgmentRepository from '../../src/data/judgment-repository';

describe('SCEN-132: 人員追加が必要な場合、推定完了時間と残り時間の差から必要な追加作業者数を逆算して推奨調整に含める', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate required additional workers from time gap and recommend staffing adjustment', async () => {
    // Arrange
    const input = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T14:30:00Z',
      userId: 'USR001',
    };

    const mockProgressData = {
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'TEAM001',
      remainingWorkQuantity: 500,
      completedQuantity: 1500,
      progressRate: 75,
    };

    const mockProductivityData = [
      {
        workerId: 'W001',
        facilityId: 'F001',
        averageProcessingTimeMinutes: 2.5,
        errorRate: 2,
      },
      {
        workerId: 'W002',
        facilityId: 'F001',
        averageProcessingTimeMinutes: 2.5,
        errorRate: 2,
      },
      {
        workerId: 'W003',
        facilityId: 'F001',
        averageProcessingTimeMinutes: 2.5,
        errorRate: 2,
      },
    ];

    const mockFacilityInfo = {
      facilityId: 'F001',
      facilityName: 'Facility A',
      currentProgressRate: 75,
      plannedProgressRate: 85,
    };

    // Calculate average productivity: 1 / 2.5 minutes per item = 0.4 items per minute
    const averageProductivityPerMinute = 1 / 2.5; // 0.4 items/minute
    const currentWorkerCount = 3;
    const timeShortageMinutes = 60;
    const remainingTimeMinutes = 120;

    // Calculate required additional workers using br-tx_4-003 formula:
    // requiredAdditionalWorkers = Math.ceil((timeShortageMinutes × averageProductivityPerMinute × currentWorkerCount) / remainingTimeMinutes)
    // = Math.ceil((60 × 0.4 × 3) / 120) = Math.ceil(72 / 120) = Math.ceil(0.6) = 1
    const requiredAdditionalWorkers = Math.ceil(
      (timeShortageMinutes * averageProductivityPerMinute * currentWorkerCount) / remainingTimeMinutes
    );

    // Setup mock implementations at module level before function call
    (progressDataRepository.getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue([mockProgressData]);

    (productivityDataRepository.getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue(mockProductivityData);

    (facilityRepository.getFacilityInfo as jest.Mock).mockResolvedValue(mockFacilityInfo);

    (validation.validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);

    (riskCalculation.calculateDelayRiskScore as jest.Mock).mockReturnValue({
      estimatedCompletionTimeMinutes: 180,
      remainingTimeMinutes: 120,
      timeShortageMinutes: 60,
      riskScore: 72.5,
    });

    (riskCalculation.classifyDelayReason as jest.Mock).mockReturnValue({
      facilityId: 'F001',
      insufficientStaffContribution: 55,
      efficiencyDeclineContribution: 25,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    });

    (riskCalculation.rankFacilitiesByRiskPriority as jest.Mock).mockReturnValue({
      rankedFacilities: [
        {
          facilityId: 'F001',
          facilityName: 'Facility A',
          riskScore: 72.5,
          riskLevel: 'HIGH',
          predictedDelayDays: 0.5,
          currentProgressRate: 75,
          plannedProgressRate: 85,
          priorityRank: 1,
        },
      ],
    });

    (adjustmentRecommendation.generateRecommendedAdjustments as jest.Mock).mockReturnValue([
      {
        facilityId: 'F001',
        adjustmentType: 'ADD_PERSONNEL',
        adjustmentDescription: `他拠点から${requiredAdditionalWorkers}名の人員融通`,
        estimatedEffectiveness: 45,
        implementationPriority: 1,
      },
    ]);

    (judgmentRepository.saveDelayRiskJudgment as jest.Mock).mockResolvedValue('JDG20240115143001');

    // Act
    const result = await monitorAndJudgeDelayRisk(input);

    // Assert
    expect(result.judgmentId).toBe('JDG20240115143001');
    expect(result.evaluationDateTime).toBe('2024-01-15T14:30:00Z');
    expect(result.hasHighRiskFacilities).toBe(true);

    expect(result.rankedFacilities).toHaveLength(1);
    expect(result.rankedFacilities[0]).toMatchObject({
      facilityId: 'F001',
      riskScore: 72.5,
      riskLevel: 'HIGH',
      priorityRank: 1,
    });

    expect(result.delayReasonClassifications).toHaveLength(1);
    expect(result.delayReasonClassifications[0]).toMatchObject({
      facilityId: 'F001',
      insufficientStaffContribution: 55,
      efficiencyDeclineContribution: 25,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    });

    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    const staffingAdjustment = result.recommendedAdjustments.find(
      (adj) => adj.facilityId === 'F001' && adj.adjustmentType === 'ADD_PERSONNEL'
    );
    expect(staffingAdjustment).toBeDefined();

    // Verify that the required additional workers calculation is correct
    expect(requiredAdditionalWorkers).toBe(1);

    // Verify that the adjustment description contains the exact staffing adjustment content
    expect(staffingAdjustment?.adjustmentDescription).toBe(`他拠点から${requiredAdditionalWorkers}名の人員融通`);

    // Verify that the adjustment effectiveness is positive
    expect(staffingAdjustment?.estimatedEffectiveness).toBeGreaterThan(0);
    expect(staffingAdjustment?.estimatedEffectiveness).toBeLessThanOrEqual(100);

    // Verify that the implementation priority is set
    expect(staffingAdjustment?.implementationPriority).toBeGreaterThan(0);
  });
});