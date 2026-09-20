import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1557: 進捗遅延リスク常時監視', () => {
  it('進捗遅延の要因が人員不足・効率低下・優先順位誤りの3分類に自動分類され、各要因の寄与度が数値化される', async () => {
    // 入力値を準備する
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:00:00Z',
      userId: 'user-001',
    };

    // monitorAndJudgeDelayRiskを実行する
    const output = await monitorAndJudgeDelayRisk(input);

    // 出力型MonitorAndJudgeDelayRiskOutputが返されること
    expect(output).toBeDefined();

    // judgmentId: 一意の進捗遅延リスク判定結果識別子が格納されていること
    expect(output.judgmentId).toBeDefined();
    expect(typeof output.judgmentId).toBe('string');
    expect(output.judgmentId.length).toBeGreaterThan(0);

    // evaluationDateTime: 入力値がそのまま格納されていること
    expect(output.evaluationDateTime).toBe('2024-01-15T10:00:00Z');

    // rankedFacilities: 複数拠点がリスク度の高い順にソートされた配列
    expect(output.rankedFacilities).toBeDefined();
    expect(Array.isArray(output.rankedFacilities)).toBe(true);
    expect(output.rankedFacilities.length).toBeGreaterThan(0);

    // 1番目（priority=1）: facilityId='F001'、riskScore=75、riskLevel='high'
    const facility1 = output.rankedFacilities.find((f) => f.facilityId === 'F001');
    expect(facility1).toBeDefined();
    expect(facility1!.priorityRank).toBe(1);
    expect(facility1!.riskScore).toBe(75);
    expect(facility1!.riskLevel).toBe('HIGH');
    expect(facility1!.predictedDelayDays).toBe(45 / 1440); // 45分をおおよその日数に換算

    // 2番目（priority=2）: facilityId='F002'、riskScore=55、riskLevel='medium'
    const facility2 = output.rankedFacilities.find((f) => f.facilityId === 'F002');
    expect(facility2).toBeDefined();
    expect(facility2!.priorityRank).toBe(2);
    expect(facility2!.riskScore).toBe(55);
    expect(facility2!.riskLevel).toBe('MEDIUM');
    expect(facility2!.predictedDelayDays).toBe(20 / 1440); // 20分をおおよその日数に換算

    // delayReasonClassifications: 各拠点の遅延要因が3分類に自動分類
    expect(output.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(output.delayReasonClassifications)).toBe(true);
    expect(output.delayReasonClassifications.length).toBeGreaterThanOrEqual(2);

    // F001の分類
    const f001Classification = output.delayReasonClassifications.find(
      (d) => d.facilityId === 'F001'
    );
    expect(f001Classification).toBeDefined();
    expect(f001Classification!.insufficientStaffContribution).toBe(45.0);
    expect(f001Classification!.efficiencyDeclineContribution).toBe(35.0);
    expect(f001Classification!.priorityMisalignmentContribution).toBe(20.0);
    expect(f001Classification!.primaryDelayReason).toBe('INSUFFICIENT_STAFF');

    // F002の分類
    const f002Classification = output.delayReasonClassifications.find(
      (d) => d.facilityId === 'F002'
    );
    expect(f002Classification).toBeDefined();
    expect(f002Classification!.insufficientStaffContribution).toBe(30.0);
    expect(f002Classification!.efficiencyDeclineContribution).toBe(50.0);
    expect(f002Classification!.priorityMisalignmentContribution).toBe(20.0);
    expect(f002Classification!.primaryDelayReason).toBe('EFFICIENCY_DECLINE');

    // recommendedAdjustments: 対応が必要な拠点ごとに推奨調整内容
    expect(output.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(output.recommendedAdjustments)).toBe(true);
    expect(output.recommendedAdjustments.length).toBeGreaterThanOrEqual(2);

    // F001の推奨調整
    const f001Adjustment = output.recommendedAdjustments.find(
      (a) => a.facilityId === 'F001'
    );
    expect(f001Adjustment).toBeDefined();
    expect(
      f001Adjustment!.adjustmentDescription.toLowerCase().includes('人員') ||
        f001Adjustment!.adjustmentDescription.toLowerCase().includes('優先度')
    ).toBe(true);

    // F002の推奨調整
    const f002Adjustment = output.recommendedAdjustments.find(
      (a) => a.facilityId === 'F002'
    );
    expect(f002Adjustment).toBeDefined();
    expect(
      f002Adjustment!.adjustmentDescription.toLowerCase().includes('優先度') ||
        f002Adjustment!.adjustmentDescription.toLowerCase().includes('プロセス')
    ).toBe(true);

    // hasHighRiskFacilities: riskLevel='high'以上の拠点が存在
    expect(output.hasHighRiskFacilities).toBe(true);
  });
});