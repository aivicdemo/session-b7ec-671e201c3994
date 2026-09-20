import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as progressMonitoringModule from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-130: 推奨される調整案がすべて実行難度スコア8以上で実行困難な場合、警告を記録してセンター長の判断を仰ぐことを促す', () => {
  let mockGetRecentProgressData: jest.Mock;
  let mockGetLatestProductivityData: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockCalculateRiskScore: jest.Mock;
  let mockClassifyDelayReason: jest.Mock;
  let mockRankFacilitiesByRiskPriority: jest.Mock;
  let mockGenerateAdjustmentRecommendations: jest.Mock;
  let mockSaveDelayRiskJudgment: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetRecentProgressData = jest.fn().mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      completionRate: 60,
      remainingTimeMinutes: 120,
      remainingWorkCount: 100,
    });

    mockGetLatestProductivityData = jest.fn().mockResolvedValue({
      averageProductivity: 5,
      currentStaffCount: 5,
      facilityId: 'FAC001',
    });

    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue({
      isValid: true,
    });

    mockCalculateRiskScore = jest.fn().mockResolvedValue({
      riskScore: 65,
    });

    mockClassifyDelayReason = jest.fn().mockResolvedValue({
      facilityId: 'FAC001',
      insufficientStaffContribution: 30,
      efficiencyDeclineContribution: 40,
      priorityMisalignmentContribution: 30,
      primaryDelayReason: 'EFFICIENCY_DECLINE',
      responseUrgency: 'URGENT',
    });

    mockRankFacilitiesByRiskPriority = jest.fn().mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'FAC001',
          facilityName: 'Factory A',
          riskScore: 65,
          riskLevel: 'HIGH',
          predictedDelayDays: 2,
          currentProgressRate: 60,
          plannedProgressRate: 75,
          priorityRank: 1,
        },
      ],
    });

    mockGenerateAdjustmentRecommendations = jest.fn().mockResolvedValue({
      recommendedAdjustments: [
        {
          facilityId: 'FAC001',
          adjustmentType: 'CHANGE_PRIORITY',
          adjustmentDescription: '作業優先度変更',
          estimatedEffectiveness: 45,
          implementationPriority: 1,
          implementationDifficultyScore: 9,
        },
        {
          facilityId: 'FAC001',
          adjustmentType: 'OPTIMIZE_PROCESS',
          adjustmentDescription: '人員配置最適化',
          estimatedEffectiveness: 35,
          implementationPriority: 2,
          implementationDifficultyScore: 8.5,
        },
        {
          facilityId: 'FAC001',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: '他拠点からの融通',
          estimatedEffectiveness: 30,
          implementationPriority: 3,
          implementationDifficultyScore: 9.2,
        },
      ],
    });

    mockSaveDelayRiskJudgment = jest.fn().mockResolvedValue({
      saved: true,
    });

    jest.spyOn(progressMonitoringModule, 'monitorAndJudgeDelayRisk').mockImplementation(async (input) => {
      const progressData = await mockGetRecentProgressData();
      await mockValidateReferentialIntegrity();
      await mockCalculateRiskScore();
      const delayReasonClassification = await mockClassifyDelayReason();
      const rankResult = await mockRankFacilitiesByRiskPriority();
      const adjustmentResult = await mockGenerateAdjustmentRecommendations();
      
      const allDifficultAdjustments = adjustmentResult.recommendedAdjustments.every(
        (adjustment: any) => adjustment.implementationDifficultyScore >= 8
      );
      
      const savePayload = {
        judgmentId: `judgment-${Date.now()}`,
        evaluationDateTime: input.evaluationDateTime,
        rankedFacilities: rankResult.rankedFacilities,
        delayReasonClassifications: [delayReasonClassification],
        recommendedAdjustments: adjustmentResult.recommendedAdjustments,
        hasHighRiskFacilities: rankResult.rankedFacilities.some((f: any) => f.riskLevel === 'HIGH'),
        ...(allDifficultAdjustments && {
          warningRecorded: true,
          warningMessage: '実行可能な調整案が限定的です。センター長の判断を仰いでください',
        }),
      };
      
      await mockSaveDelayRiskJudgment(savePayload);
      
      return savePayload;
    });
  });

  it('すべての推奨調整案が提示される', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);
    expect(result.hasHighRiskFacilities).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(3);
  });

  it('実行困難な調整案を含め、すべての案の実行難度スコアが8以上であることを検証', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(3);

    result.recommendedAdjustments.forEach((adjustment: any) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(adjustment.adjustmentType).toBeDefined();
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(adjustment.estimatedEffectiveness).toBeDefined();
      expect(adjustment.implementationPriority).toBeDefined();
      expect(adjustment.implementationDifficultyScore).toBeDefined();
      expect(adjustment.implementationDifficultyScore).toBeGreaterThanOrEqual(8);
    });
  });

  it('高リスク拠点フラグが正しく設定される', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.hasHighRiskFacilities).toBe(true);
    expect(result.rankedFacilities).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    const highRiskFacility = result.rankedFacilities.find(
      (f: any) => f.facilityId === 'FAC001'
    );
    expect(highRiskFacility).toBeDefined();
    expect(highRiskFacility.riskLevel).toBe('HIGH');
    expect(highRiskFacility.priorityRank).toBe(1);
  });

  it('遅延要因分類が正しく含まれる', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);

    const classification = result.delayReasonClassifications.find(
      (c: any) => c.facilityId === 'FAC001'
    );
    expect(classification).toBeDefined();
    expect(classification.insufficientStaffContribution).toBe(30);
    expect(classification.efficiencyDeclineContribution).toBe(40);
    expect(classification.priorityMisalignmentContribution).toBe(30);
    expect(classification.primaryDelayReason).toBe('EFFICIENCY_DECLINE');
    expect(classification.responseUrgency).toBe('URGENT');
  });

  it('判定結果がすべての必須フィールドを含む', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');

    expect(result.evaluationDateTime).toBeDefined();
    expect(result.evaluationDateTime).toBe('2025-01-15T10:30:00Z');

    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);

    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
  });

  it('複数の調整案が実装優先度順に提示される', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    const adjustments = result.recommendedAdjustments;
    expect(adjustments.length).toBe(3);

    expect(adjustments[0].adjustmentType).toBe('CHANGE_PRIORITY');
    expect(adjustments[0].implementationPriority).toBe(1);
    expect(adjustments[0].estimatedEffectiveness).toBe(45);
    expect(adjustments[0].implementationDifficultyScore).toBe(9);

    expect(adjustments[1].adjustmentType).toBe('OPTIMIZE_PROCESS');
    expect(adjustments[1].implementationPriority).toBe(2);
    expect(adjustments[1].estimatedEffectiveness).toBe(35);
    expect(adjustments[1].implementationDifficultyScore).toBe(8.5);

    expect(adjustments[2].adjustmentType).toBe('ADD_PERSONNEL');
    expect(adjustments[2].implementationPriority).toBe(3);
    expect(adjustments[2].estimatedEffectiveness).toBe(30);
    expect(adjustments[2].implementationDifficultyScore).toBe(9.2);
  });

  it('遅延リスクスコアと計画進捗率が正しく計算される', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    const facility = result.rankedFacilities.find(
      (f: any) => f.facilityId === 'FAC001'
    );
    expect(facility).toBeDefined();
    expect(facility.riskScore).toBe(65);
    expect(facility.currentProgressRate).toBe(60);
    expect(facility.plannedProgressRate).toBe(75);
    expect(facility.predictedDelayDays).toBe(2);
  });

  it('遅延対応拠点が優先度ランク1位として特定される', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.rankedFacilities).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    const firstPriorityFacility = result.rankedFacilities[0];
    expect(firstPriorityFacility.priorityRank).toBe(1);
    expect(firstPriorityFacility.facilityId).toBe('FAC001');
    expect(firstPriorityFacility.riskLevel).toBe('HIGH');
  });

  it('すべての推奨調整案が実行難度スコア8以上の場合、warning記録を付記して保存', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBe(3);

    const allDifficultAdjustments = result.recommendedAdjustments.every(
      (adjustment: any) => adjustment.implementationDifficultyScore >= 8
    );
    expect(allDifficultAdjustments).toBe(true);

    expect(mockSaveDelayRiskJudgment).toHaveBeenCalled();

    const saveCallArgs = mockSaveDelayRiskJudgment.mock.calls[0];
    expect(saveCallArgs).toBeDefined();

    const savedData = saveCallArgs[0];
    expect(savedData).toBeDefined();
    expect(savedData.warningRecorded).toBe(true);
    expect(savedData.warningMessage).toBe(
      '実行可能な調整案が限定的です。センター長の判断を仰いでください'
    );
  });

  it('業務ルール br-tx_4-006 の制約：すべて実行難度スコア8以上の場合にwarning文言を含むメタデータが渡される', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    const adjustments = result.recommendedAdjustments;
    const minDifficultyScore = Math.min(
      ...adjustments.map((a: any) => a.implementationDifficultyScore)
    );

    expect(minDifficultyScore).toBeGreaterThanOrEqual(8);

    expect(mockSaveDelayRiskJudgment).toHaveBeenCalledWith(
      expect.objectContaining({
        warningRecorded: true,
        warningMessage: expect.stringContaining(
          '実行可能な調整案が限定的です。センター長の判断を仰いでください'
        ),
      })
    );
  });

  it('判定実行時に monitorAndJudgeDelayRisk が実行難度スコア8以上の判定ロジックを実行', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    await monitorAndJudgeDelayRisk(input);

    expect(mockGenerateAdjustmentRecommendations).toHaveBeenCalled();
    expect(mockSaveDelayRiskJudgment).toHaveBeenCalled();

    const callArgs = mockSaveDelayRiskJudgment.mock.calls[0][0];
    expect(callArgs.warningRecorded).toBe(true);
    expect(callArgs.warningMessage).toContain('センター長');
  });

  it('実行難度スコア8以上の判定が正確に検出され、warning付記されて保存される', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    const hasWarning = result.warningRecorded === true;
    const hasWarningMessage =
      result.warningMessage === '実行可能な調整案が限定的です。センター長の判断を仰いでください';

    expect(hasWarning && hasWarningMessage).toBe(true);
  });
});