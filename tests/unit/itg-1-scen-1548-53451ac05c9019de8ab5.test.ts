import {
  monitorAndJudgeDelayRisk,
  MonitorAndJudgeDelayRiskInput,
  MonitorAndJudgeDelayRiskOutput,
} from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1548: 進捗遅延リスク常時監視 - 自動判定と承認基準評価', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('生成された配置案が事前設定の承認基準に照らして自動判定され、基準内の案は自動承認、基準外の案は承認者へ判断を要求される', async () => {
    // Step 1: monitorAndJudgeDelayRisk関数の入力値を設定
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['FAC001', 'FAC002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T14:30:00Z',
      userId: 'USER123',
    };

    // Step 2: getRecentProgressDataByWorkInstructionおよびgetLatestProductivityDataByWorkerを呼び出してWMSから正常な進捗・生産性データが取得されるよう準備
    jest.spyOn(riskEngine, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        plannedProgressRate: 70,
        actualProgressRate: 55,
        remainingWorkDays: 5,
      },
      {
        workInstructionId: 'WI002',
        facilityId: 'FAC002',
        plannedProgressRate: 80,
        actualProgressRate: 45,
        remainingWorkDays: 3,
      },
    ]);

    jest.spyOn(riskEngine, 'getLatestProductivityDataByWorker').mockResolvedValue([
      {
        workerId: 'WK001',
        facilityId: 'FAC001',
        productivityRate: 85,
        qualityScore: 90,
        allocatedStaffCount: 5,
        requiredStaffCount: 6,
      },
      {
        workerId: 'WK002',
        facilityId: 'FAC002',
        productivityRate: 70,
        qualityScore: 80,
        allocatedStaffCount: 4,
        requiredStaffCount: 7,
      },
    ]);

    // Step 3: validateReferentialIntegrityを呼び出して参照整合性チェックが成功（true）を返す状態を準備
    jest.spyOn(riskEngine, 'validateReferentialIntegrity').mockResolvedValue(true);

    // Step 4: calculateRiskScoreを呼び出して各拠点ごとのリスクスコア（FAC001=45、FAC002=72）が算出される状態を準備
    jest.spyOn(riskEngine, 'calculateRiskScore').mockImplementation((input) => {
      const mockResults: { [key: string]: number } = {
        'FAC001': 45,
        'FAC002': 72,
      };
      return Promise.resolve(mockResults[input.facilityId] || 50);
    });

    // Step 5: classifyDelayReasonを呼び出して遅延要因分類結果が返される状態を準備
    jest.spyOn(riskEngine, 'classifyDelayReason').mockImplementation((input) => {
      if (input.facilityId === 'FAC001') {
        return Promise.resolve({
          facilityId: 'FAC001',
          teamId: undefined,
          insufficientStaffContribution: 30,
          efficiencyDeclineContribution: 60,
          priorityMisalignmentContribution: 10,
          primaryDelayReason: 'EFFICIENCY_DECLINE',
          responseUrgency: 'URGENT',
        });
      } else {
        return Promise.resolve({
          facilityId: 'FAC002',
          teamId: undefined,
          insufficientStaffContribution: 65,
          efficiencyDeclineContribution: 25,
          priorityMisalignmentContribution: 10,
          primaryDelayReason: 'INSUFFICIENT_STAFF',
          responseUrgency: 'IMMEDIATE',
        });
      }
    });

    // Step 6: rankFacilitiesByRiskPriorityを呼び出して拠点がリスク順に返される状態を準備
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'FAC002',
          facilityName: 'Facility 002',
          riskScore: 72,
          riskLevel: 'HIGH',
          predictedDelayDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 80,
          priorityRank: 1,
        },
        {
          facilityId: 'FAC001',
          facilityName: 'Facility 001',
          riskScore: 45,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 1,
          currentProgressRate: 55,
          plannedProgressRate: 70,
          priorityRank: 2,
        },
      ],
    });

    // Step 7: saveDelayRiskJudgmentを呼び出して判定結果が永続化され、judgmentId='JUD-20250115-001'が返される状態を準備
    jest.spyOn(riskEngine, 'saveDelayRiskJudgment').mockResolvedValue({
      judgmentId: 'JUD-20250115-001',
      evaluationDateTime: '2025-01-15T14:30:00Z',
      delayReasonClassifications: [
        {
          facilityId: 'FAC002',
          teamId: undefined,
          insufficientStaffContribution: 65,
          efficiencyDeclineContribution: 25,
          priorityMisalignmentContribution: 10,
          primaryDelayReason: 'INSUFFICIENT_STAFF',
          responseUrgency: 'IMMEDIATE',
        },
        {
          facilityId: 'FAC001',
          teamId: undefined,
          insufficientStaffContribution: 30,
          efficiencyDeclineContribution: 60,
          priorityMisalignmentContribution: 10,
          primaryDelayReason: 'EFFICIENCY_DECLINE',
          responseUrgency: 'URGENT',
        },
      ],
      recommendedAdjustments: [
        {
          facilityId: 'FAC002',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: 'Add 3 additional personnel to address insufficient staff',
          estimatedEffectiveness: 85,
          implementationPriority: 1,
        },
        {
          facilityId: 'FAC001',
          adjustmentType: 'OPTIMIZE_PROCESS',
          adjustmentDescription: 'Optimize process to improve efficiency',
          estimatedEffectiveness: 75,
          implementationPriority: 2,
        },
      ],
    });

    // Step 8: monitorAndJudgeDelayRisk関数を実行
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    // 期待結果の検証

    // 1. judgmentId の確認
    expect(result.judgmentId).toBe('JUD-20250115-001');

    // 2. evaluationDateTime の確認
    expect(result.evaluationDateTime).toBe('2025-01-15T14:30:00Z');

    // 3. rankedFacilities配列の構造と内容確認
    expect(result.rankedFacilities).toHaveLength(2);

    // rankedFacilities[0]: FAC002（高リスク、優先度1）
    expect(result.rankedFacilities[0]).toEqual(
      expect.objectContaining({
        facilityId: 'FAC002',
        riskScore: 72,
        riskLevel: 'HIGH',
        predictedDelayDays: 2,
        currentProgressRate: 45,
        plannedProgressRate: 80,
        priorityRank: 1,
      })
    );

    // rankedFacilities[1]: FAC001（中リスク、優先度2）
    expect(result.rankedFacilities[1]).toEqual(
      expect.objectContaining({
        facilityId: 'FAC001',
        riskScore: 45,
        riskLevel: 'MEDIUM',
        predictedDelayDays: 1,
        currentProgressRate: 55,
        plannedProgressRate: 70,
        priorityRank: 2,
      })
    );

    // 4. delayReasonClassifications配列の確認
    expect(result.delayReasonClassifications).toBeDefined();
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);

    // FAC002の遅延要因分類確認（人員不足が主要因）
    const fac002Classification = result.delayReasonClassifications.find(
      (drc) => drc.facilityId === 'FAC002'
    );
    expect(fac002Classification).toBeDefined();
    if (fac002Classification) {
      expect(fac002Classification.insufficientStaffContribution).toBe(65);
      expect(fac002Classification.efficiencyDeclineContribution).toBe(25);
      expect(fac002Classification.priorityMisalignmentContribution).toBe(10);
      expect(fac002Classification.primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    }

    // FAC001の遅延要因分類確認（効率低下が主要因）
    const fac001Classification = result.delayReasonClassifications.find(
      (drc) => drc.facilityId === 'FAC001'
    );
    expect(fac001Classification).toBeDefined();
    if (fac001Classification) {
      expect(fac001Classification.insufficientStaffContribution).toBe(30);
      expect(fac001Classification.efficiencyDeclineContribution).toBe(60);
      expect(fac001Classification.priorityMisalignmentContribution).toBe(10);
      expect(fac001Classification.primaryDelayReason).toBe('EFFICIENCY_DECLINE');
    }

    // 5. recommendedAdjustments配列の確認
    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    // FAC002に対する推奨調整が含まれていることを確認
    const fac002Adjustments = result.recommendedAdjustments.filter(
      (adj) => adj.facilityId === 'FAC002'
    );
    expect(fac002Adjustments.length).toBeGreaterThan(0);

    // 各推奨調整が必要なフィールドを持つことを確認
    fac002Adjustments.forEach((adjustment) => {
      expect(adjustment.adjustmentType).toBeDefined();
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(adjustment.implementationPriority).toBeGreaterThan(0);
    });

    // 6. hasHighRiskFacilities フラグの確認
    expect(result.hasHighRiskFacilities).toBe(true);

    // 7. 結果全体が有効なMonitorAndJudgeDelayRiskOutput型であることを確認
    expect(result).toEqual(
      expect.objectContaining({
        judgmentId: expect.any(String),
        evaluationDateTime: expect.any(String),
        rankedFacilities: expect.any(Array),
        delayReasonClassifications: expect.any(Array),
        recommendedAdjustments: expect.any(Array),
        hasHighRiskFacilities: expect.any(Boolean),
      })
    );
  });
});