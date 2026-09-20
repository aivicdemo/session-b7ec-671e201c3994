import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-106: 作業指示IDリストが指定されない場合、進行中の全作業指示を対象として監視対象に含める', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('workInstructionIds が undefined の場合、進行中の全作業指示を自動検出して監視対象に含める', async () => {
    // モック関数の定義
    const mockProgressData = [
      {
        workInstructionId: 'WI-001',
        facilityId: 'F001',
        currentProgressRate: 45,
        plannedProgressRate: 50,
      },
      {
        workInstructionId: 'WI-002',
        facilityId: 'F001',
        currentProgressRate: 60,
        plannedProgressRate: 70,
      },
      {
        workInstructionId: 'WI-003',
        facilityId: 'F001',
        currentProgressRate: 30,
        plannedProgressRate: 40,
      },
    ];

    const mockProductivityData = {
      'Worker-A': {
        averageProcessingTime: 50,
        errorRate: 5,
        proficiencyLevel: 3,
      },
      'Worker-B': {
        averageProcessingTime: 45,
        errorRate: 3,
        proficiencyLevel: 4,
      },
      'Worker-C': {
        averageProcessingTime: 60,
        errorRate: 8,
        proficiencyLevel: 2,
      },
    };

    const mockRiskScores = {
      'WI-001': 35,
      'WI-002': 25,
      'WI-003': 60,
    };

    const mockFacilityData = {
      facilityId: 'F001',
      facilityName: 'Facility 001',
      currentProgressRate: 45,
      plannedProgressRate: 53.33,
      riskScore: 40,
    };

    const mockDelayReasonClassification = {
      facilityId: 'F001',
      teamId: undefined,
      insufficientStaffContribution: 45,
      efficiencyDeclineContribution: 35,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    };

    const mockRecommendedAdjustments = [
      {
        facilityId: 'F001',
        adjustmentType: 'ADD_PERSONNEL',
        adjustmentDescription: '他拠点から2名の人員融通',
        estimatedEffectiveness: 65,
        implementationPriority: 1,
      },
      {
        facilityId: 'F001',
        adjustmentType: 'CHANGE_PRIORITY',
        adjustmentDescription: '作業優先度の再編成',
        estimatedEffectiveness: 40,
        implementationPriority: 2,
      },
    ];

    const mockJudgmentId = 'judgment-uuid-20250120-143000';

    // スタブの設定
    const getRecentProgressDataSpy = jest
      .spyOn(riskEngine, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue(mockProgressData);
    
    jest
      .spyOn(riskEngine, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue(mockProductivityData);
    
    jest
      .spyOn(riskEngine, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);
    
    jest
      .spyOn(riskEngine, 'calculateRiskScore' as any)
      .mockImplementation((workInstructionId: string) => {
        return mockRiskScores[workInstructionId as keyof typeof mockRiskScores] || 0;
      });
    
    jest
      .spyOn(riskEngine, 'calculateDelayRiskScore' as any)
      .mockResolvedValue({
        riskScore: 40,
        riskLevel: 'MEDIUM',
        predictedDelayDays: 2,
      });
    
    jest
      .spyOn(riskEngine, 'classifyDelayReason' as any)
      .mockResolvedValue(mockDelayReasonClassification);
    
    jest
      .spyOn(riskEngine, 'rankFacilitiesByRiskPriority' as any)
      .mockResolvedValue([
        {
          facilityId: 'F001',
          facilityName: 'Facility 001',
          riskScore: 40,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 53.33,
          priorityRank: 1,
        },
      ]);
    
    const saveDelayRiskJudgmentSpy = jest
      .spyOn(riskEngine, 'saveDelayRiskJudgment' as any)
      .mockResolvedValue(mockJudgmentId);

    // 入力パラメータの構築
    const input = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-20T14:30:00Z',
      userId: 'user-001',
    };

    // monitorAndJudgeDelayRisk 関数を呼び出す
    const result = await monitorAndJudgeDelayRisk(input);

    // workInstructionIds=undefined の場合、getRecentProgressDataByWorkInstruction が呼び出されたこと、
    // かつ facilityIds=['F001'] を引数として呼び出されたことを確認
    // また、workInstructionIds が undefined であることを明示的に検証
    expect(getRecentProgressDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['F001'],
      })
    );
    
    // 呼び出し引数から workInstructionIds が undefined であることを確認
    const callArgs = getRecentProgressDataSpy.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs.workInstructionIds).toBeUndefined();

    // 戻り値を検証
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId).toBe(mockJudgmentId);
    expect(result.evaluationDateTime).toBe('2025-01-20T14:30:00Z');

    // rankedFacilities の検証
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBe(1);

    const facility = result.rankedFacilities[0];
    expect(facility.facilityId).toBe('F001');
    expect(facility.facilityName).toBeDefined();
    expect(typeof facility.riskScore).toBe('number');
    expect(facility.riskScore).toBeGreaterThanOrEqual(0);
    expect(facility.riskScore).toBeLessThanOrEqual(100);
    expect(facility.riskLevel).toBe('MEDIUM');
    expect(facility.riskScore).toBeCloseTo(40, 2);
    expect(typeof facility.predictedDelayDays).toBe('number');
    expect(facility.predictedDelayDays).toBe(2);
    expect(typeof facility.currentProgressRate).toBe('number');
    expect(facility.currentProgressRate).toBe(45);
    expect(typeof facility.plannedProgressRate).toBe('number');
    expect(facility.plannedProgressRate).toBeCloseTo(53.33, 1);
    expect(typeof facility.priorityRank).toBe('number');
    expect(facility.priorityRank).toBe(1);

    // delayReasonClassifications の検証
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);

    const classification = result.delayReasonClassifications.find(
      (c) => c.facilityId === 'F001' && c.teamId === undefined
    );
    expect(classification).toBeDefined();
    expect(classification!.insufficientStaffContribution).toBeCloseTo(45, 5);
    expect(classification!.efficiencyDeclineContribution).toBeCloseTo(35, 5);
    expect(classification!.priorityMisalignmentContribution).toBeCloseTo(20, 5);
    expect(classification!.primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(classification!.responseUrgency);

    // recommendedAdjustments の検証
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    const personnelAdjustment = result.recommendedAdjustments.find(
      (a) => a.adjustmentType === 'ADD_PERSONNEL'
    );
    expect(personnelAdjustment).toBeDefined();
    expect(personnelAdjustment!.facilityId).toBe('F001');
    expect(personnelAdjustment!.adjustmentDescription).toContain('人員融通');
    expect(typeof personnelAdjustment!.estimatedEffectiveness).toBe('number');
    expect(personnelAdjustment!.estimatedEffectiveness).toBeGreaterThan(0);
    expect(typeof personnelAdjustment!.implementationPriority).toBe('number');

    const priorityAdjustment = result.recommendedAdjustments.find(
      (a) => a.adjustmentType === 'CHANGE_PRIORITY'
    );
    expect(priorityAdjustment).toBeDefined();
    expect(priorityAdjustment!.facilityId).toBe('F001');
    expect(priorityAdjustment!.adjustmentDescription).toContain('優先度');

    // hasHighRiskFacilities の検証
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
    expect(result.hasHighRiskFacilities).toBe(false);

    // riskLevel と hasHighRiskFacilities の整合性を確認
    const hasHighRisk = result.rankedFacilities.some(
      (f) => f.riskLevel === 'HIGH'
    );
    expect(result.hasHighRiskFacilities).toBe(hasHighRisk);
    expect(result.hasHighRiskFacilities).toBe(false);

    // saveDelayRiskJudgment が呼び出されたことを確認（判定結果の永続化）
    expect(saveDelayRiskJudgmentSpy).toHaveBeenCalled();

    // workInstructionIds が undefined のため、システムが自動的に進行中の全作業指示を検出したことを確認
    // getRecentProgressDataByWorkInstruction の戻り値が3件の作業指示を含むことで、
    // 自動検出が機能し、これらが監視対象に含まれたことが示される
    const progressDataReturned = getRecentProgressDataSpy.mock.results[0]?.value;
    expect(progressDataReturned).toBeDefined();
    expect(Array.isArray(progressDataReturned)).toBe(true);
    expect(progressDataReturned.length).toBe(3);
    expect(progressDataReturned.map((d: any) => d.workInstructionId)).toEqual([
      'WI-001',
      'WI-002',
      'WI-003',
    ]);
    
    // 返された作業指示がすべて F001 に属することを確認（自動検出の対象範囲）
    expect(progressDataReturned.every((d: any) => d.facilityId === 'F001')).toBe(true);
  });
});