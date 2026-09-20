import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1559: 進捗遅延リスク判定エンジンが納期遅延の可能性を検出し、対応が必要な拠点ごとに人員配置案・作業優先度変更案・追加対応内容が自動生成される', () => {
  it('should detect delay risk and generate staffing adjustments for multiple facilities', async () => {
    const evaluationDateTime = '2024-01-15T14:30:00Z';
    const userId = 'user-admin-001';
    const facilityIds = ['facility-001', 'facility-002'];

    const result = await monitorAndJudgeDelayRisk({
      facilityIds,
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime,
      userId,
    });

    // 1. judgmentId: UUID形式の一意識別子が生成されている
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // 2. evaluationDateTime: 入力値と同じ
    expect(result.evaluationDateTime).toBe(evaluationDateTime);

    // 3. rankedFacilities: 対応優先度の高い順にランク付けされた配列
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    // facility-001 が優先度1で存在し、high リスクレベル
    const facility001 = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility-001'
    );
    expect(facility001).toBeDefined();
    expect(facility001!.priorityRank).toBe(1);
    expect(facility001!.riskLevel).toBe('HIGH');
    expect(facility001!.riskScore).toBe(75);
    expect(facility001!.facilityName).toBeDefined();
    expect(typeof facility001!.facilityName).toBe('string');
    expect(facility001!.predictedDelayDays).toBeDefined();
    expect(typeof facility001!.predictedDelayDays).toBe('number');
    expect(facility001!.currentProgressRate).toBeDefined();
    expect(facility001!.plannedProgressRate).toBeDefined();

    // facility-002 が優先度2で存在し、medium リスクレベル
    const facility002 = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility-002'
    );
    expect(facility002).toBeDefined();
    expect(facility002!.priorityRank).toBe(2);
    expect(facility002!.riskLevel).toBe('MEDIUM');
    expect(facility002!.riskScore).toBe(45);

    // 優先度順の確認
    if (result.rankedFacilities.length > 1) {
      for (let i = 0; i < result.rankedFacilities.length - 1; i++) {
        expect(result.rankedFacilities[i].priorityRank).toBeLessThanOrEqual(
          result.rankedFacilities[i + 1].priorityRank
        );
      }
    }

    // 4. delayReasonClassifications: 拠点別の遅延要因分類
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);

    const facility001Classification = result.delayReasonClassifications.find(
      (c) => c.facilityId === 'facility-001'
    );
    expect(facility001Classification).toBeDefined();
    expect(facility001Classification!.insufficientStaffContribution).toBe(60);
    expect(facility001Classification!.efficiencyDeclineContribution).toBe(25);
    expect(facility001Classification!.priorityMisalignmentContribution).toBe(15);
    expect(facility001Classification!.primaryDelayReason).toBe(
      'INSUFFICIENT_STAFF'
    );
    expect([0, 1, 2]).toContain(
      facility001Classification!.insufficientStaffContribution +
        facility001Classification!.efficiencyDeclineContribution +
        facility001Classification!.priorityMisalignmentContribution -
        100
    ); // 寄与度の合計が100に近い（小数点考慮）
    expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(
      facility001Classification!.responseUrgency
    );

    const facility002Classification = result.delayReasonClassifications.find(
      (c) => c.facilityId === 'facility-002'
    );
    expect(facility002Classification).toBeDefined();

    // 5. recommendedAdjustments: 対応が必要な拠点ごとの推奨調整内容
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    // facility-001 の調整案
    const facility001Adjustments = result.recommendedAdjustments.filter(
      (a) => a.facilityId === 'facility-001'
    );
    expect(facility001Adjustments.length).toBeGreaterThan(0);

    // 人員追加（ADD_PERSONNEL）が含まれているか確認
    const hasPersonnelAdjustment = facility001Adjustments.some(
      (a) => a.adjustmentType === 'ADD_PERSONNEL'
    );
    expect(hasPersonnelAdjustment).toBe(true);

    // 各調整案の構造を検証
    facility001Adjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBe('facility-001');
      expect(adjustment.adjustmentType).toBeDefined();
      expect([
        'ADD_PERSONNEL',
        'CHANGE_PRIORITY',
        'OPTIMIZE_PROCESS',
        'EXTEND_DEADLINE',
      ]).toContain(adjustment.adjustmentType);
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(adjustment.estimatedEffectiveness).toBeDefined();
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(adjustment.implementationPriority).toBeDefined();
      expect(typeof adjustment.implementationPriority).toBe('number');
      expect(adjustment.implementationPriority).toBeGreaterThan(0);
    });

    // facility-002 の調整案
    const facility002Adjustments = result.recommendedAdjustments.filter(
      (a) => a.facilityId === 'facility-002'
    );
    expect(facility002Adjustments.length).toBeGreaterThanOrEqual(0);

    // 実装優先度順の確認
    if (facility001Adjustments.length > 1) {
      for (let i = 0; i < facility001Adjustments.length - 1; i++) {
        expect(facility001Adjustments[i].implementationPriority).toBeLessThanOrEqual(
          facility001Adjustments[i + 1].implementationPriority
        );
      }
    }

    // 6. hasHighRiskFacilities: true（facility-001が高リスク）
    expect(result.hasHighRiskFacilities).toBe(true);

    // 全体の構造確認
    expect(result).toHaveProperty('judgmentId');
    expect(result).toHaveProperty('evaluationDateTime');
    expect(result).toHaveProperty('rankedFacilities');
    expect(result).toHaveProperty('delayReasonClassifications');
    expect(result).toHaveProperty('recommendedAdjustments');
    expect(result).toHaveProperty('hasHighRiskFacilities');
  });
});