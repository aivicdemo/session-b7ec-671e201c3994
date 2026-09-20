import { jest } from '@jest/globals';
import {
  extractAndRankAllocationPlansForReview,
  ExtractAndRankAllocationPlansForReviewInput,
  ExtractAndRankAllocationPlansForReviewOutput,
  RankedAllocationPlanForReview,
} from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-305: 優先度フィルタが medium の場合、優先度が medium のみの配置案が返される', () => {
  it('should return only medium priority allocation plans when priorityFilter is medium', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'U001',
      targetFacilityIds: ['F001', 'F002', 'F003', 'F004'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'medium',
      maxResultCount: 50,
    };

    const result: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    // 1. allocationPlansフィールドに、riskLevel='medium'に合致する配置案のみが含まれること
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    
    // candidateA と candidateC の2件のみが返却される
    expect(result.allocationPlans.length).toBe(2);
    
    // すべての返却配置案のリスクレベルが 'medium' であることを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.delayRiskLevel).toBe('medium');
    });

    // 2. candidateB(riskLevel='low')とcandidateD(riskLevel='high')は除外されていること
    const facilityIds = result.allocationPlans.map((plan) => plan.facilityId);
    expect(facilityIds).toContain('F001'); // candidateA
    expect(facilityIds).toContain('F003'); // candidateC
    expect(facilityIds).not.toContain('F002'); // candidateB (low)
    expect(facilityIds).not.toContain('F004'); // candidateD (high)

    // 3. 返却される配置案は、rankingPriority の降順（高い順）に並べられていることを確認
    const rankings = result.allocationPlans.map((plan) => plan.rankingPriority);
    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i]).toBeLessThanOrEqual(rankings[i - 1]);
    }

    // 4. 各配置案には以下のフィールドが含まれること
    result.allocationPlans.forEach((plan) => {
      // allocationPlanId (candidateId相当)
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');
      
      // facilityId
      expect(plan.facilityId).toBeDefined();
      expect(typeof plan.facilityId).toBe('string');
      
      // allocatedWorkerCount (proposedWorkers相当)
      expect(plan.allocatedWorkerCount).toBeDefined();
      expect(typeof plan.allocatedWorkerCount).toBe('number');
      expect(plan.allocatedWorkerCount).toBeGreaterThan(0);
      
      // expectedCompletionDate (estimatedCompletionTime相当)
      expect(plan.expectedCompletionDate).toBeDefined();
      expect(typeof plan.expectedCompletionDate).toBe('string');
      
      // rankingPriority (priorityScore: 0-100の数値)
      expect(plan.rankingPriority).toBeDefined();
      expect(typeof plan.rankingPriority).toBe('number');
      expect(plan.rankingPriority).toBeGreaterThan(0);
      
      // delayRiskLevel ('critical'|'high'|'medium'|'low')
      expect(plan.delayRiskLevel).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(plan.delayRiskLevel);
      
      // recommendationReason (日本語テキスト)
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
    });

    // 5. totalCountフィールドが2を示すこと
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBe(2);

    // 6. analysisCompletedAtフィールドがISO 8601形式の日時を示すこと
    expect(result.analysisCompletedAt).toBeDefined();
    expect(typeof result.analysisCompletedAt).toBe('string');
    const completedDate = new Date(result.analysisCompletedAt);
    expect(completedDate.toString()).not.toBe('Invalid Date');
    // ISO 8601 形式の検証
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.analysisCompletedAt)).toBe(true);

    // 7. dataFreshnessフィールドが正しい構造を持つこと
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeDefined();
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    
    expect(result.dataFreshness.productivityDataAge).toBeDefined();
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    
    expect(result.dataFreshness.riskJudgmentAge).toBeDefined();
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);

    // 8. エラーが発生しないこと
    // (非同期処理で例外が発生しなかったことが暗黙に検証される)
  });
});