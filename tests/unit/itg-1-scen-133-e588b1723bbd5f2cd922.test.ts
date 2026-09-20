import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-133: リスクレベルが高に設定された場合、作業優先度変更と人員追加の両者を推奨調整内容に含める', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リスクレベルが高の場合、人員追加と作業優先度変更の両方を推奨調整に含める', async () => {
    // Mock the internal functions that monitorAndJudgeDelayRisk depends on
    const mockCalculateDelayRiskScore = jest.fn().mockResolvedValue({
      riskScore: 75,
      progressGap: 20,
      estimatedCompletionTimeMinutes: 16.67,
      riskLevel: 'HIGH',
    });

    const mockClassifyDelayReason = jest.fn().mockResolvedValue({
      facilityId: 'FAC001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'IMMEDIATE',
    });

    const mockRankFacilitiesByRiskPriority = jest.fn().mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'FAC001',
          facilityName: 'FAC001',
          riskScore: 75,
          riskLevel: 'HIGH',
          predictedDelayDays: 1,
          currentProgressRate: 60,
          plannedProgressRate: 80,
          priorityRank: 1,
        },
      ],
    });

    const mockSaveDelayRiskJudgment = jest.fn().mockResolvedValue({
      judgmentId: '550e8400-e29b-41d4-a716-446655440000',
    });

    // Patch the module functions
    jest.spyOn(riskEngine, 'calculateDelayRiskScore' as any).mockImplementation(mockCalculateDelayRiskScore);
    jest.spyOn(riskEngine, 'classifyDelayReason' as any).mockImplementation(mockClassifyDelayReason);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority' as any).mockImplementation(mockRankFacilitiesByRiskPriority);
    jest.spyOn(riskEngine, 'saveDelayRiskJudgment' as any).mockImplementation(mockSaveDelayRiskJudgment);

    // Arrange
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    // Act
    const result = await monitorAndJudgeDelayRisk(input);

    // Assert
    // ① judgmentId は UUID形式の文字列
    expect(result.judgmentId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // ② evaluationDateTime は '2025-01-15T10:30:00Z' と一致
    expect(result.evaluationDateTime).toBe('2025-01-15T10:30:00Z');

    // ③ rankedFacilities[0] は facilityId='FAC001'、riskLevel='high' または 'HIGH'
    expect(result.rankedFacilities).toHaveLength(1);
    expect(result.rankedFacilities[0]).toMatchObject({
      facilityId: 'FAC001',
    });
    expect(result.rankedFacilities[0].riskLevel.toUpperCase()).toBe('HIGH');
    expect(result.rankedFacilities[0].priorityRank).toBe(1);

    // ④ delayReasonClassifications は各要因を含み、合計が100に正規化
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const classification = result.delayReasonClassifications[0];
    expect(classification.facilityId).toBe('FAC001');
    expect(classification).toHaveProperty('insufficientStaffContribution');
    expect(classification).toHaveProperty('efficiencyDeclineContribution');
    expect(classification).toHaveProperty('priorityMisalignmentContribution');

    const totalContribution =
      classification.insufficientStaffContribution +
      classification.efficiencyDeclineContribution +
      classification.priorityMisalignmentContribution;
    expect(totalContribution).toBe(100);

    // ⑤ recommendedAdjustments に人員追加と作業優先度変更の両方を含む
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(2);

    const adjustmentTypes = result.recommendedAdjustments.map((adj) => adj.adjustmentType);
    expect(adjustmentTypes).toContain('ADD_PERSONNEL');
    expect(adjustmentTypes).toContain('CHANGE_PRIORITY');

    // 人員追加の推奨調整を確認
    const addPersonnelAdj = result.recommendedAdjustments.find(
      (adj) => adj.adjustmentType === 'ADD_PERSONNEL'
    );
    expect(addPersonnelAdj).toBeDefined();
    expect(addPersonnelAdj?.facilityId).toBe('FAC001');
    expect(addPersonnelAdj?.adjustmentDescription).toBeTruthy();
    expect(addPersonnelAdj?.adjustmentDescription).toMatch(/人員|融通|追加/);
    expect(addPersonnelAdj?.adjustmentDescription.length).toBeGreaterThan(0);
    expect(addPersonnelAdj?.estimatedEffectiveness).toBeGreaterThan(0);
    expect(addPersonnelAdj?.estimatedEffectiveness).toBeLessThanOrEqual(100);
    expect(addPersonnelAdj?.implementationPriority).toBeGreaterThan(0);

    // 優先度変更の推奨調整を確認
    const changePriorityAdj = result.recommendedAdjustments.find(
      (adj) => adj.adjustmentType === 'CHANGE_PRIORITY'
    );
    expect(changePriorityAdj).toBeDefined();
    expect(changePriorityAdj?.facilityId).toBe('FAC001');
    expect(changePriorityAdj?.adjustmentDescription).toBeTruthy();
    expect(changePriorityAdj?.adjustmentDescription).toMatch(/優先度|優先順位/);
    expect(changePriorityAdj?.adjustmentDescription.length).toBeGreaterThan(0);
    expect(changePriorityAdj?.estimatedEffectiveness).toBeGreaterThan(0);
    expect(changePriorityAdj?.estimatedEffectiveness).toBeLessThanOrEqual(100);
    expect(changePriorityAdj?.implementationPriority).toBeGreaterThan(0);

    // ⑥ hasHighRiskFacilities は true
    expect(result.hasHighRiskFacilities).toBe(true);

    // ⑦ 業務ルール br-tx_4-003 に従った判定確認
    const facility = result.rankedFacilities[0];
    expect(facility.riskLevel.toUpperCase()).toBe('HIGH');
    expect(facility.riskScore).toBe(75);
    expect(facility.predictedDelayDays).toBeGreaterThan(0);
    expect(facility.currentProgressRate).toBeLessThan(facility.plannedProgressRate);
    
    // 進捗乖離率20%の検証
    const progressGap = facility.plannedProgressRate - facility.currentProgressRate;
    expect(progressGap).toBe(20);
    
    // 推定完了時間（残作業500件÷(3.0件/分×10名)≈16.67分）不足の検証
    expect(mockCalculateDelayRiskScore).toHaveBeenCalledWith(
      expect.objectContaining({
        plannedProgressRate: 80,
        actualProgressRate: 60,
        remainingWorkDays: expect.any(Number),
      })
    );

    // ⑧ saveDelayRiskJudgmentが呼び出され、riskLevelとrecommendedAdjustmentsが正しく渡されている
    expect(mockSaveDelayRiskJudgment).toHaveBeenCalledWith(
      expect.objectContaining({
        riskLevel: 'HIGH',
        recommendedAdjustments: expect.arrayContaining([
          expect.objectContaining({
            facilityId: 'FAC001',
            adjustmentType: 'ADD_PERSONNEL',
          }),
          expect.objectContaining({
            facilityId: 'FAC001',
            adjustmentType: 'CHANGE_PRIORITY',
          }),
        ]),
      })
    );

    // ⑨ 推奨調整が正常に生成されている
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(2);
    result.recommendedAdjustments.forEach((adj) => {
      expect(adj.facilityId).toBeTruthy();
      expect(adj.adjustmentType).toBeTruthy();
      expect(adj.adjustmentDescription).toBeTruthy();
      expect(adj.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adj.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(adj.implementationPriority).toBeGreaterThan(0);
    });

    // 内部関数呼び出しの検証
    expect(mockCalculateDelayRiskScore).toHaveBeenCalled();
    expect(mockClassifyDelayReason).toHaveBeenCalled();
    expect(mockRankFacilitiesByRiskPriority).toHaveBeenCalled();
    expect(mockSaveDelayRiskJudgment).toHaveBeenCalled();
  });
});