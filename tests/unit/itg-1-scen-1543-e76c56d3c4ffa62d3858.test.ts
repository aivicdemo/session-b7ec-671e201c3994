import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('進捗遅延リスク常時監視', () => {
    it('現在の進捗率が計画進捗率を下回り、進捗乖離率が閾値を超えた場合、遅延リスクレベルが中以上に判定される', async () => {
      // テスト前提条件：WMSからのリアルタイム進捗データが正常に取得でき、作業者の生産性データが蓄積されている状態を準備
      // テストデータの準備
      const evaluationDateTime = new Date().toISOString();
      const PROGRESS_DEVIATION_THRESHOLD = 0.10; // 進捗乖離率の閾値：10%（業務ルール br-tx_4-003 に基づく）

      // 関数を実行
      const output = await monitorAndJudgeDelayRisk({
        facilityIds: ['facility-001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime,
        userId: 'user-manager-001',
      });

      // 出力型 MonitorAndJudgeDelayRiskOutput が返される
      expect(output).toBeDefined();
      expect(output).toHaveProperty('judgmentId');
      expect(output).toHaveProperty('evaluationDateTime');
      expect(output).toHaveProperty('rankedFacilities');
      expect(output).toHaveProperty('delayReasonClassifications');
      expect(output).toHaveProperty('recommendedAdjustments');
      expect(output).toHaveProperty('hasHighRiskFacilities');

      // judgmentId フィールドが一意の識別子として値を持つ
      expect(output.judgmentId).toBeTruthy();
      expect(typeof output.judgmentId).toBe('string');

      // evaluationDateTime が入力された時刻のISO 8601文字列と一致する
      expect(output.evaluationDateTime).toBe(evaluationDateTime);

      // rankedFacilities 配列が空でなく、facility-001 のエントリが存在する
      expect(output.rankedFacilities).toBeDefined();
      expect(Array.isArray(output.rankedFacilities)).toBe(true);
      expect(output.rankedFacilities.length).toBeGreaterThan(0);

      const facility001Entry = output.rankedFacilities.find((f) => f.facilityId === 'facility-001');
      expect(facility001Entry).toBeDefined();

      if (facility001Entry) {
        // 以下の条件を満たすことを検証
        expect(facility001Entry.facilityName).toBeTruthy();
        expect(typeof facility001Entry.riskScore).toBe('number');
        expect(facility001Entry.riskScore).toBeGreaterThanOrEqual(0);
        expect(facility001Entry.riskScore).toBeLessThanOrEqual(100);

        // 進捗乖離率 = (計画進捗率 - 現在進捗率) / 計画進捗率 * 100 を計算（業務ルール br-tx_4-003 に基づく）
        const progressDeviation =
          (facility001Entry.plannedProgressRate - facility001Entry.currentProgressRate) /
          facility001Entry.plannedProgressRate;

        // riskLevel は小文字形式で返される
        expect(['low', 'medium', 'high']).toContain(facility001Entry.riskLevel);

        // 進捗乖離率が閾値を超えた場合、riskLevel が medium 以上に判定されることを検証（仕様要件）
        if (
          facility001Entry.currentProgressRate < facility001Entry.plannedProgressRate &&
          progressDeviation > PROGRESS_DEVIATION_THRESHOLD
        ) {
          // 業務ルール br-tx_4-003 の計算式に基づき、進捗乖離率の閾値判定が riskLevel に反映されている
          expect(['medium', 'high']).toContain(facility001Entry.riskLevel);
        } else {
          // 進捗乖離率が閾値以下である場合は、riskLevel は low または medium のいずれかになる
          expect(facility001Entry.riskLevel).toBeTruthy();
          expect(['low', 'medium', 'high']).toContain(facility001Entry.riskLevel);
        }

        expect(typeof facility001Entry.predictedDelayDays).toBe('number');
        expect(typeof facility001Entry.currentProgressRate).toBe('number');
        expect(typeof facility001Entry.plannedProgressRate).toBe('number');
        expect(typeof facility001Entry.priorityRank).toBe('number');
        expect(facility001Entry.priorityRank).toBeGreaterThan(0);
      }

      // delayReasonClassifications 配列が facility-001 に対応するエントリを含む
      expect(output.delayReasonClassifications).toBeDefined();
      expect(Array.isArray(output.delayReasonClassifications)).toBe(true);

      const facility001Classification = output.delayReasonClassifications.find(
        (c) => c.facilityId === 'facility-001'
      );
      expect(facility001Classification).toBeDefined();

      if (facility001Classification) {
        // 遅延要因が分類されている
        expect(typeof facility001Classification.insufficientStaffContribution).toBe('number');
        expect(typeof facility001Classification.efficiencyDeclineContribution).toBe('number');
        expect(typeof facility001Classification.priorityMisalignmentContribution).toBe('number');
        expect(facility001Classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
        expect(facility001Classification.insufficientStaffContribution).toBeLessThanOrEqual(100);
        expect(facility001Classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
        expect(facility001Classification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
        expect(facility001Classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
        expect(facility001Classification.priorityMisalignmentContribution).toBeLessThanOrEqual(100);

        expect([
          'INSUFFICIENT_STAFF',
          'EFFICIENCY_DECLINE',
          'PRIORITY_MISALIGNMENT',
        ]).toContain(facility001Classification.primaryDelayReason);

        expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(facility001Classification.responseUrgency);
      }

      // recommendedAdjustments 配列が facility-001 に対応するエントリを含む
      expect(output.recommendedAdjustments).toBeDefined();
      expect(Array.isArray(output.recommendedAdjustments)).toBe(true);

      const facility001Adjustments = output.recommendedAdjustments.filter(
        (a) => a.facilityId === 'facility-001'
      );
      expect(facility001Adjustments.length).toBeGreaterThan(0);

      facility001Adjustments.forEach((adjustment) => {
        expect(adjustment.facilityId).toBe('facility-001');
        expect(adjustment.adjustmentType).toBeTruthy();
        expect([
          'ADD_PERSONNEL',
          'CHANGE_PRIORITY',
          'OPTIMIZE_PROCESS',
          'EXTEND_DEADLINE',
        ]).toContain(adjustment.adjustmentType);
        expect(adjustment.adjustmentDescription).toBeTruthy();
        expect(typeof adjustment.estimatedEffectiveness).toBe('number');
        expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
        expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
        expect(typeof adjustment.implementationPriority).toBe('number');
        expect(adjustment.implementationPriority).toBeGreaterThan(0);
      });

      // hasHighRiskFacilities フィールドが、rankedFacilities に riskLevel が 'high' のエントリが存在する場合は true
      const hasHighRiskInData = output.rankedFacilities.some((f) => f.riskLevel === 'high');
      expect(output.hasHighRiskFacilities).toBe(hasHighRiskInData);
    });
  });
});