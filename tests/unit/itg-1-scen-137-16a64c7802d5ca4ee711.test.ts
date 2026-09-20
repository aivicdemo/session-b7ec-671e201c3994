import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-137: 進捗遅延リスク判定結果の一意識別子（judgmentId）を生成して出力に含める', () => {
  it('monitorAndJudgeDelayRiskが正常に実行され、MonitorAndJudgeDelayRiskOutputが返却される', async () => {
    // 入力値を準備する
    const input = {
      facilityIds: ['FAC-001', 'FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-A001',
    };

    // monitorAndJudgeDelayRiskを呼び出す
    const output = await monitorAndJudgeDelayRisk(input);

    // 出力型MonitorAndJudgeDelayRiskOutputのjudgmentIdフィールドを検証する
    expect(output).toBeDefined();
    expect(output.judgmentId).toBeDefined();
    expect(typeof output.judgmentId).toBe('string');
    expect(output.judgmentId.length).toBeGreaterThan(0);

    // judgmentIdが一意識別子として妥当であることを検証する
    // UUID形式またはタイムスタンプ+ランダム文字列などの形式をチェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = uuidRegex.test(output.judgmentId);
    expect(isValidUuid || /^\d{10,}[a-zA-Z0-9]+$/.test(output.judgmentId)).toBe(true);

    // 出力型MonitorAndJudgeDelayRiskOutputの他のフィールドが正常に構築されていることを確認する
    expect(output.evaluationDateTime).toBe('2025-01-15T10:30:00Z');
    expect(Array.isArray(output.rankedFacilities)).toBe(true);
    expect(Array.isArray(output.delayReasonClassifications)).toBe(true);
    expect(Array.isArray(output.recommendedAdjustments)).toBe(true);
    expect(typeof output.hasHighRiskFacilities).toBe('boolean');

    // rankedFacilitiesの構造を検証
    if (output.rankedFacilities.length > 0) {
      const facility = output.rankedFacilities[0];
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.riskScore).toBe('number');
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(facility.riskLevel);
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(typeof facility.currentProgressRate).toBe('number');
      expect(typeof facility.plannedProgressRate).toBe('number');
      expect(typeof facility.priorityRank).toBe('number');
    }

    // delayReasonClassificationsの構造を検証
    if (output.delayReasonClassifications.length > 0) {
      const classification = output.delayReasonClassifications[0];
      expect(classification.facilityId).toBeDefined();
      expect(typeof classification.insufficientStaffContribution).toBe('number');
      expect(typeof classification.efficiencyDeclineContribution).toBe('number');
      expect(typeof classification.priorityMisalignmentContribution).toBe('number');
      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        classification.primaryDelayReason
      );
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(classification.responseUrgency);
    }

    // recommendedAdjustmentsの構造を検証
    if (output.recommendedAdjustments.length > 0) {
      const adjustment = output.recommendedAdjustments[0];
      expect(adjustment.facilityId).toBeDefined();
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustment.adjustmentType
      );
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(typeof adjustment.implementationPriority).toBe('number');
    }
  });

  it('複数回呼び出しても異なるjudgmentIdが生成される', async () => {
    const input = {
      facilityIds: ['FAC-001', 'FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-A001',
    };

    // 同じ入力で複数回呼び出す
    const output1 = await monitorAndJudgeDelayRisk(input);
    const output2 = await monitorAndJudgeDelayRisk(input);

    // 異なるjudgmentIdが生成されることを確認
    expect(output1.judgmentId).not.toBe(output2.judgmentId);
  });

  it('rankedFacilitiesが対応優先度の高い順にソートされている', async () => {
    const input = {
      facilityIds: ['FAC-001', 'FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-A001',
    };

    const output = await monitorAndJudgeDelayRisk(input);

    // rankedFacilitiesが複数ある場合、priorityRankが昇順になっていることを確認
    if (output.rankedFacilities.length > 1) {
      for (let i = 0; i < output.rankedFacilities.length - 1; i++) {
        expect(output.rankedFacilities[i].priorityRank).toBeLessThanOrEqual(
          output.rankedFacilities[i + 1].priorityRank
        );
      }
    }
  });

  it('hasHighRiskFacilitiesはrankedFacilitiesの内容と整合している', async () => {
    const input = {
      facilityIds: ['FAC-001', 'FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-A001',
    };

    const output = await monitorAndJudgeDelayRisk(input);

    // hasHighRiskFacilitiesと実際の高リスク拠点の有無が一致していることを確認
    const hasHighRiskActual = output.rankedFacilities.some(facility => facility.riskLevel === 'HIGH');
    expect(output.hasHighRiskFacilities).toBe(hasHighRiskActual);
  });
});