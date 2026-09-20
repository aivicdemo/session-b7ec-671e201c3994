import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1550: 進捗遅延リスク常時監視 - 承認済み配置案に基づいて作業指示が生成される', () => {
  it('monitorAndJudgeDelayRisk が入力データに基づいてリスク判定を実行し、ランク付けされた拠点情報と遅延要因分類、推奨調整内容を返却する', async () => {
    // Step 1: 入力型 MonitorAndJudgeDelayRiskInput を構築
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    // Step 2: 対象関数を呼び出す
    const result = await monitorAndJudgeDelayRisk(input);

    // Step 3: rankedFacilities フィールドを検査
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    // Step 4: 先頭要素が最優先拠点であることを確認（リスクスコアが高い）
    const topFacility = result.rankedFacilities[0];
    expect(topFacility).toBeDefined();
    expect(topFacility.facilityId).toBeDefined();
    expect(topFacility.facilityName).toBeDefined();
    expect(typeof topFacility.riskScore).toBe('number');
    expect(topFacility.riskScore).toBeGreaterThanOrEqual(0);
    expect(topFacility.riskScore).toBeLessThanOrEqual(100);
    expect(topFacility.priorityRank).toBe(1);

    // ランク付けが正確であることを確認（スコアが降順）
    for (let i = 1; i < result.rankedFacilities.length; i++) {
      expect(result.rankedFacilities[i].riskScore).toBeLessThanOrEqual(
        result.rankedFacilities[i - 1].riskScore
      );
      expect(result.rankedFacilities[i].priorityRank).toBe(i + 1);
    }

    // Step 5: delayReasonClassifications が空でなく、遅延要因分類が含まれていることを確認
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);

    result.delayReasonClassifications.forEach((classification) => {
      expect(classification.facilityId).toBeDefined();
      expect(typeof classification.insufficientStaffContribution).toBe('number');
      expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
      expect(classification.insufficientStaffContribution).toBeLessThanOrEqual(100);
      expect(typeof classification.efficiencyDeclineContribution).toBe('number');
      expect(classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
      expect(typeof classification.priorityMisalignmentContribution).toBe('number');
      expect(classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
      expect(classification.priorityMisalignmentContribution).toBeLessThanOrEqual(100);
      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        classification.primaryDelayReason
      );
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(classification.responseUrgency);
    });

    // Step 6: recommendedAdjustments が空でなく、対応優先度順に調整案が格納されていることを確認
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    result.recommendedAdjustments.forEach((adjustment, index) => {
      expect(adjustment.facilityId).toBeDefined();
      expect([
        'ADD_PERSONNEL',
        'CHANGE_PRIORITY',
        'OPTIMIZE_PROCESS',
        'EXTEND_DEADLINE',
      ]).toContain(adjustment.adjustmentType);
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(adjustment.adjustmentDescription.length).toBeGreaterThan(0);
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(typeof adjustment.implementationPriority).toBe('number');
      if (index > 0) {
        expect(adjustment.implementationPriority).toBeGreaterThanOrEqual(
          result.recommendedAdjustments[index - 1].implementationPriority
        );
      }
    });

    // Step 7: hasHighRiskFacilities が true であることを確認
    expect(result.hasHighRiskFacilities).toBe(true);

    // Step 8: judgmentId が UUID形式であることを確認
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(result.judgmentId).toMatch(uuidRegex);

    // Step 9: evaluationDateTime が入力時刻と一致することを確認
    expect(result.evaluationDateTime).toBe('2025-01-15T10:30:00Z');
  });
});