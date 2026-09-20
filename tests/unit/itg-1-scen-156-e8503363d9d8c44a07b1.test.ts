import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import { GenerateAllocationPlansInput, GenerateAllocationPlansOutput } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-156: 生成された複数の配置案が推奨順位に基づいてランク付けされる', () => {
  it('should generate allocation plans with recommended ranking sorted by feasibility score and risk level', async () => {
    // Step 1: 入力型 GenerateAllocationPlansInput を構築
    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH',
          delayPredictionDays: 5,
          currentProgressRate: 30,
          plannedProgressRate: 50,
          recommendedAction: 'Increase staffing',
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: 'work-002',
          facilityId: 'facility-002',
          teamId: 'team-002',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 2,
          currentProgressRate: 60,
          plannedProgressRate: 70,
          recommendedAction: 'Monitor closely',
        },
        {
          riskJudgmentId: 'risk-003',
          workInstructionId: 'work-003',
          facilityId: 'facility-003',
          teamId: 'team-003',
          riskLevel: 'LOW',
          delayPredictionDays: 0,
          currentProgressRate: 85,
          plannedProgressRate: 80,
          recommendedAction: 'Proceed as planned',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.95,
          qualityScore: 95,
          proficiencyLevel: 'EXPERT',
          recentWorkResults: [
            { workInstructionId: 'work-001', completionRate: 1.0, errorCount: 0 },
          ],
        },
        {
          workerId: 'worker-002',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.80,
          qualityScore: 85,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            { workInstructionId: 'work-001', completionRate: 0.95, errorCount: 1 },
          ],
        },
        {
          workerId: 'worker-003',
          facilityId: 'facility-002',
          teamId: 'team-002',
          productivityRate: 0.70,
          qualityScore: 75,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            { workInstructionId: 'work-002', completionRate: 0.80, errorCount: 2 },
          ],
        },
        {
          workerId: 'worker-004',
          facilityId: 'facility-002',
          teamId: 'team-002',
          productivityRate: 0.65,
          qualityScore: 70,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            { workInstructionId: 'work-002', completionRate: 0.60, errorCount: 3 },
          ],
        },
        {
          workerId: 'worker-005',
          facilityId: 'facility-003',
          teamId: 'team-003',
          productivityRate: 0.88,
          qualityScore: 90,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            { workInstructionId: 'work-003', completionRate: 0.99, errorCount: 0 },
          ],
        },
      ],
      targetFacilityIds: ['facility-001', 'facility-002', 'facility-003'],
      targetTeamIds: ['team-001', 'team-002', 'team-003'],
      workInstructionIds: ['work-001', 'work-002', 'work-003'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    // Step 2: generateAllocationPlans を呼び出す
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // Step 3: 出力型 GenerateAllocationPlansOutput.recommendedRanking 配列を取得
    const { recommendedRanking, allocationPlans, readyForDelivery } = output;

    // Step 4: recommendedRanking 配列内の全要素について rank フィールドの値を確認
    expect(recommendedRanking).toBeDefined();
    expect(Array.isArray(recommendedRanking)).toBe(true);
    expect(recommendedRanking.length).toBeGreaterThan(0);

    for (const ranking of recommendedRanking) {
      expect(ranking.rank).toBeDefined();
      expect(typeof ranking.rank).toBe('number');
      expect(ranking.rank).toBeGreaterThan(0);
      expect(ranking.planId).toBeDefined();
      expect(typeof ranking.planId).toBe('string');
      expect(ranking.feasibilityScore).toBeDefined();
      expect(typeof ranking.feasibilityScore).toBe('number');
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);
      expect(ranking.recommendationReason).toBeDefined();
      expect(typeof ranking.recommendationReason).toBe('string');
      expect(ranking.riskLevel).toMatch(/HIGH|MEDIUM|LOW/);
    }

    // Step 5: recommendedRanking 配列の要素が rank の昇順で格納されていることを検証
    for (let i = 0; i < recommendedRanking.length; i++) {
      expect(recommendedRanking[i].rank).toBe(i + 1);
    }

    // Step 6: 各要素の rank, planId, feasibilityScore, recommendationReason, riskLevel が期待される型・値を持つことを確認
    const rankValues = recommendedRanking.map(r => r.rank);
    const expectedRanks = Array.from({ length: rankValues.length }, (_, i) => i + 1);
    expect(rankValues).toEqual(expectedRanks);

    // Step 7: recommendedRanking の要素数が allocationPlans の要素数と一致することを検証
    expect(recommendedRanking.length).toBe(allocationPlans.length);

    // Step 8: feasibilityScore が正しい順序で並んでいること、かつ riskLevel の優先度を考慮していることを検証
    const feasibilityScores = recommendedRanking.map(r => r.feasibilityScore);
    
    // rank=1 の要素が feasibilityScore 最高値を持つことを確認
    const maxFeasibilityScore = Math.max(...feasibilityScores);
    expect(recommendedRanking[0].feasibilityScore).toBe(maxFeasibilityScore);

    // rank=2 の要素が次点（2番目に高い値）を持つことを確認
    if (recommendedRanking.length > 1) {
      const uniqueScores = [...new Set(feasibilityScores)].sort((a, b) => b - a);
      if (uniqueScores.length > 1) {
        expect(recommendedRanking[1].feasibilityScore).toBe(uniqueScores[1]);
      }
    }

    // rank=2 以降の要素が前の要素以下の feasibilityScore を持つことを確認
    for (let i = 0; i < feasibilityScores.length - 1; i++) {
      expect(feasibilityScores[i]).toBeGreaterThanOrEqual(feasibilityScores[i + 1]);
    }

    // 同じ feasibilityScore を持つ要素が存在する場合、riskLevel の優先度（HIGH < MEDIUM < LOW）を考慮していることを検証
    const riskLevelPriority: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    for (let i = 0; i < recommendedRanking.length - 1; i++) {
      const current = recommendedRanking[i];
      const next = recommendedRanking[i + 1];
      
      if (current.feasibilityScore === next.feasibilityScore) {
        const currentPriority = riskLevelPriority[current.riskLevel];
        const nextPriority = riskLevelPriority[next.riskLevel];
        expect(currentPriority).toBeLessThanOrEqual(nextPriority);
      }
    }

    // 各ランクの planId が allocationPlans 内の対応する案と一致することを検証
    const planIdMap = new Map(allocationPlans.map(plan => [plan.planId, plan]));
    for (const ranking of recommendedRanking) {
      expect(planIdMap.has(ranking.planId)).toBe(true);
    }

    // readyForDelivery が true であることを検証
    expect(readyForDelivery).toBe(true);

    // すべての要素が recommendationReason フィールドで推奨理由を記載していることを検証
    for (const ranking of recommendedRanking) {
      expect(ranking.recommendationReason.length).toBeGreaterThan(0);
    }
  });
});