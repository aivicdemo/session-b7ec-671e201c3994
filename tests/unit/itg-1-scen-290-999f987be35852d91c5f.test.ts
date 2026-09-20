import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-290: 納期リスク・スキルマッチ・進捗状況・作業負荷バランスの4要素にウェイトが適用されて最終優先度スコアが計算される', () => {
  it('should calculate priority scores with weighted factors and return ranked allocation plans', async () => {
    // 入力値の準備
    const input = {
      userId: 'centerhead-001',
      targetFacilityIds: ['FAC-001', 'FAC-002', 'FAC-003'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    // テスト実行
    const result = await extractAndRankAllocationPlansForReview(input);

    // 出力検証
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBe(4);
    expect(result.totalCount).toBe(4);
    expect(result.analysisCompletedAt).toBeDefined();
    expect(result.dataFreshness).toBeDefined();

    // 優先度スコア降順の検証
    const plans = result.allocationPlans;
    
    // 案1: priorityScore = 70.25（最優先）
    expect(plans[0].allocationPlanId).toBe('CAND-001');
    expect(plans[0].facilityId).toBe('FAC-001');
    expect(plans[0].rankingPriority).toBe(1);
    expect(plans[0].delayRiskLevel).toBe('medium');
    expect(plans[0].delayRiskScore).toBeCloseTo(70.25, 1);
    expect(plans[0].allocatedWorkerCount).toBe(2);
    expect(plans[0].averageWorkerProductivityRate).toBeCloseTo(80, 1);
    expect(plans[0].recommendationReason).toContain('FAC-001');
    expect(plans[0].recommendationReason).toContain('納期リスク');
    expect(plans[0].recommendationReason).toContain('生産性');

    // 案2: priorityScore = 68.25（2番目）
    expect(plans[1].allocationPlanId).toBe('CAND-002');
    expect(plans[1].facilityId).toBe('FAC-002');
    expect(plans[1].rankingPriority).toBe(2);
    expect(plans[1].delayRiskLevel).toBe('medium');
    expect(plans[1].delayRiskScore).toBeCloseTo(68.25, 1);
    expect(plans[1].allocatedWorkerCount).toBe(3);
    expect(plans[1].averageWorkerProductivityRate).toBeCloseTo(63.33, 1);
    expect(plans[1].recommendationReason).toContain('FAC-002');
    expect(plans[1].recommendationReason).toContain('高リスク');

    // 案3: priorityScore = 66.75（3番目）
    expect(plans[2].allocationPlanId).toBe('CAND-003');
    expect(plans[2].facilityId).toBe('FAC-003');
    expect(plans[2].rankingPriority).toBe(3);
    expect(plans[2].delayRiskLevel).toBe('medium');
    expect(plans[2].delayRiskScore).toBeCloseTo(66.75, 1);
    expect(plans[2].allocatedWorkerCount).toBe(2);
    expect(plans[2].averageWorkerProductivityRate).toBeCloseTo(82.5, 1);
    expect(plans[2].recommendationReason).toContain('FAC-003');
    expect(plans[2].recommendationReason).toContain('低リスク');

    // 案4: priorityScore = 60.75（最後）
    expect(plans[3].allocationPlanId).toBe('CAND-004');
    expect(plans[3].facilityId).toBe('FAC-001');
    expect(plans[3].rankingPriority).toBe(4);
    expect(plans[3].delayRiskLevel).toBe('medium');
    expect(plans[3].delayRiskScore).toBeCloseTo(60.75, 1);
    expect(plans[3].allocatedWorkerCount).toBe(1);
    expect(plans[3].averageWorkerProductivityRate).toBeCloseTo(50, 1);
    expect(plans[3].recommendationReason).toContain('スキルレベル');
    expect(plans[3].recommendationReason).toContain('負荷集中');

    // 各配置案の詳細検証
    plans.forEach((plan) => {
      expect(plan.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(plan.currentProgressRate).toBeLessThanOrEqual(100);
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);
      expect(plan.status).toBe('pending_review');
      expect(plan.recommendationReason).toBeTruthy();
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
    });

    // 優先度スコアが降順であることを検証
    for (let i = 0; i < plans.length - 1; i++) {
      expect(plans[i].delayRiskScore).toBeGreaterThanOrEqual(plans[i + 1].delayRiskScore);
    }

    // analysisCompletedAt が有効なISO 8601形式であること
    const analysisDate = new Date(result.analysisCompletedAt);
    expect(analysisDate).toBeInstanceOf(Date);
    expect(analysisDate.getTime()).toBeGreaterThan(0);

    // dataFreshness の検証
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);

    // 加重ウェイトの検証（各要素の組み合わせが期待値に合致）
    // 納期リスク35% + スキルマッチ30% + 進捗状況20% + 作業負荷バランス15%
    // 案1: 60×0.35 + 80×0.30 + 70×0.20 + 75×0.15 = 70.25
    expect(plans[0].delayRiskScore).toBeCloseTo(
      (60 * 0.35 + 80 * 0.30 + 70 * 0.20 + 75 * 0.15),
      1
    );
    
    // 案2: 85×0.35 + 65×0.30 + 50×0.20 + 60×0.15 = 68.25
    expect(plans[1].delayRiskScore).toBeCloseTo(
      (85 * 0.35 + 65 * 0.30 + 50 * 0.20 + 60 * 0.15),
      1
    );
    
    // 案3: 35×0.35 + 85×0.30 + 85×0.20 + 80×0.15 = 66.75
    expect(plans[2].delayRiskScore).toBeCloseTo(
      (35 * 0.35 + 85 * 0.30 + 85 * 0.20 + 80 * 0.15),
      1
    );
    
    // 案4: 80×0.35 + 40×0.30 + 70×0.20 + 45×0.15 = 60.75
    expect(plans[3].delayRiskScore).toBeCloseTo(
      (80 * 0.35 + 40 * 0.30 + 70 * 0.20 + 45 * 0.15),
      1
    );

    // リスクレベル判定の検証：75以上=low、50～75未満=medium、50未満=high
    // 全案のスコアが50～75未満なので、全て'medium'
    plans.forEach((plan) => {
      if (plan.delayRiskScore >= 75) {
        expect(plan.delayRiskLevel).toBe('low');
      } else if (plan.delayRiskScore >= 50) {
        expect(plan.delayRiskLevel).toBe('medium');
      } else {
        expect(plan.delayRiskLevel).toBe('high');
      }
    });

    // 期待値に基づくリスクレベルの最終確認
    expect(plans[0].delayRiskLevel).toBe('medium'); // 70.25
    expect(plans[1].delayRiskLevel).toBe('medium'); // 68.25
    expect(plans[2].delayRiskLevel).toBe('medium'); // 66.75
    expect(plans[3].delayRiskLevel).toBe('medium'); // 60.75

    // 日付・時刻情報の検証
    expect(result.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 各配置案の詳細属性が仕様に対応していることを検証
    expect(plans[0].plannedStartDate).toBeDefined();
    expect(plans[0].plannedEndDate).toBeDefined();
    expect(plans[0].expectedCompletionDate).toBeDefined();
    expect(plans[0].predictedDelayDays).toBeDefined();
  });
});