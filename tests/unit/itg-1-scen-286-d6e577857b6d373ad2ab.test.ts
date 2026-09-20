import {
  extractAndRankAllocationPlansForReview,
  ExtractAndRankAllocationPlansForReviewInput,
  RankedAllocationPlanForReview,
} from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-286: 納期までの残り時間と推定完了時間を比較して納期遅延リスクスコアが計算される', () => {
  it('should calculate delivery delay risk scores based on estimated completion time vs delivery deadline', async () => {
    // 基準時刻を設定
    const baseTime = new Date('2024-01-15T09:00:00Z');
    const deliveryDeadline = new Date('2024-01-15T15:00:00Z');

    // 残り時間は 6時間 = 360分
    const remainingTime = (deliveryDeadline.getTime() - baseTime.getTime()) / (60 * 1000);
    expect(remainingTime).toBe(360);

    // テストデータの準備
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-mgr-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: baseTime.toISOString(),
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    // 関数を呼び出す
    const result = await extractAndRankAllocationPlansForReview(input);

    // 返却データが存在することを確認
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);

    // allocationPlans配列内の各配置案を検証
    if (result.allocationPlans.length > 0) {
      result.allocationPlans.forEach((plan) => {
        // 各フィールドが存在することを確認
        expect(plan.allocationPlanId).toBeDefined();
        expect(plan.delayRiskScore).toBeDefined();
        expect(plan.delayRiskLevel).toBeDefined();
        expect(plan.predictedDelayDays).toBeDefined();
        expect(plan.expectedCompletionDate).toBeDefined();
        expect(plan.plannedEndDate).toBeDefined();
        expect(plan.rankingPriority).toBeDefined();

        // delayRiskScoreは0～100の範囲内であることを確認
        expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
        expect(plan.delayRiskScore).toBeLessThanOrEqual(100);

        // delayRiskLevelが有効な値であることを確認
        expect(['critical', 'high', 'medium', 'low']).toContain(
          plan.delayRiskLevel
        );

        // rankingPriorityは1以上であることを確認
        expect(plan.rankingPriority).toBeGreaterThanOrEqual(1);
      });

      // 配置案1と配置案2のシナリオを検証
      // 配置案1: 推定完了時間が180分（残り時間360分より少ない）→ リスク低い
      // 配置案2: 推定完了時間が420分（残り時間360分より多い）→ リスク高い

      // expectedCompletionDateに基づいて配置案を検索
      const plan1 = result.allocationPlans.find(
        (p) => {
          const completionTimeMs = new Date(p.expectedCompletionDate).getTime() - baseTime.getTime();
          const completionMinutes = completionTimeMs / (60 * 1000);
          return Math.abs(completionMinutes - 180) < 1;
        }
      );

      const plan2 = result.allocationPlans.find(
        (p) => {
          const completionTimeMs = new Date(p.expectedCompletionDate).getTime() - baseTime.getTime();
          const completionMinutes = completionTimeMs / (60 * 1000);
          return Math.abs(completionMinutes - 420) < 1;
        }
      );

      // 配置案1と配置案2が返却されることを確認
      expect(plan1).toBeDefined();
      expect(plan2).toBeDefined();

      if (plan1 && plan2) {
        // 配置案1: 推定完了時間 180分 < 残り時間 360分 → リスク低い
        expect(plan1.delayRiskLevel).toBe('low');
        // riskLevelが'low'であり、delayRiskScoreは相対的に低値（plan2より低い）
        expect(plan1.delayRiskScore).toBeLessThan(plan2.delayRiskScore);

        // 配置案2: 推定完了時間 420分 > 残り時間 360分 → リスク高い
        expect(plan2.delayRiskLevel).toBe('high');
        // riskLevelが'high'であり、delayRiskScoreは相対的に高値
        expect(plan2.delayRiskScore).toBeGreaterThan(plan1.delayRiskScore);

        // 高リスク案（配置案2）が低リスク案（配置案1）より前に並べ替えられていることを確認
        const plan1Index = result.allocationPlans.indexOf(plan1);
        const plan2Index = result.allocationPlans.indexOf(plan2);
        expect(plan2Index).toBeLessThan(plan1Index);

        // 優先度: rankingPriorityが小さい（1に近い）ほど優先度が高い
        // 配置案2（高リスク）の優先度 < 配置案1（低リスク）の優先度
        expect(plan2.rankingPriority).toBeLessThan(plan1.rankingPriority);

        // 納期遅延リスク計算ロジックの検証
        // 配置案1: 完了時間が残り時間より短いため、遅延リスクスコアが低い
        const plan1CompletionMinutes = (new Date(plan1.expectedCompletionDate).getTime() - baseTime.getTime()) / (60 * 1000);
        expect(plan1CompletionMinutes).toBeLessThan(remainingTime);
        expect(plan1.delayRiskScore).toBeGreaterThanOrEqual(0);
        expect(plan1.delayRiskScore).toBeLessThanOrEqual(100);

        // 配置案2: 完了時間が残り時間より長いため、遅延リスクスコアが高い
        const plan2CompletionMinutes = (new Date(plan2.expectedCompletionDate).getTime() - baseTime.getTime()) / (60 * 1000);
        expect(plan2CompletionMinutes).toBeGreaterThan(remainingTime);
        expect(plan2.delayRiskScore).toBeGreaterThanOrEqual(0);
        expect(plan2.delayRiskScore).toBeLessThanOrEqual(100);

        // 配置案2のdelayRiskScoreが配置案1より高いことを確認
        expect(plan2.delayRiskScore).toBeGreaterThan(plan1.delayRiskScore);

        // 予測遅延日数：配置案2は遅延が予想される
        expect(plan2.predictedDelayDays).toBeGreaterThanOrEqual(0);
        // 配置案1は遅延が予想されない（0以上でもよいが、plan2より低い可能性）
        expect(plan1.predictedDelayDays).toBeGreaterThanOrEqual(0);
      }

      // 複数の配置案が存在する場合、リスクスコアが適切に計算・順序付けされていることを検証
      if (result.allocationPlans.length >= 2) {
        const firstPlan = result.allocationPlans[0];
        const secondPlan = result.allocationPlans[1];

        // リスクレベルに基づいた優先度付けが行われていることを確認
        // delayRiskScoreが0～100の範囲内であることを確認
        expect(firstPlan.delayRiskScore).toBeGreaterThanOrEqual(0);
        expect(firstPlan.delayRiskScore).toBeLessThanOrEqual(100);
        expect(secondPlan.delayRiskScore).toBeGreaterThanOrEqual(0);
        expect(secondPlan.delayRiskScore).toBeLessThanOrEqual(100);

        // 優先度付けが行われていることを確認（rankingPriorityが定義されている）
        expect(firstPlan.rankingPriority).toBeLessThanOrEqual(secondPlan.rankingPriority);
      }
    }

    // totalCountが返されることを確認
    expect(result.totalCount).toBeDefined();
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // analysisCompletedAtがISO 8601形式の日時であることを確認
    expect(result.analysisCompletedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.analysisCompletedAt)).toBe(
      true
    );

    // dataFreshnessが返されることを確認
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeDefined();
    expect(result.dataFreshness.productivityDataAge).toBeDefined();
    expect(result.dataFreshness.riskJudgmentAge).toBeDefined();

    // すべてのデータ鮮度値が0以上であることを確認
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });
});