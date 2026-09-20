import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import type { Tx2Imp2AgentInput, Tx2Imp2AgentOutput } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-042: 複数習熟度レベルに基づいた実現可能性スコア計算と分析メタデータの検証', () => {
  it('複数の習熟度レベルを適用した実現可能性スコア計算時に、analysisMetadataのproficiencyLevelsAppliedに全レベルが含まれる', async () => {
    // ステップ1: テスト用の生産性データを準備
    // 複数の習熟度レベル（'beginner', 'intermediate', 'advanced', 'expert'）を持つ作業者データを含める
    const facilityId = 'FAC-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const executingUserId = 'user-auth-001';

    const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    // 複数の習熟度レベルを持つ作業者の生産性データを準備
    const productivityData = [
      { workerId: 'worker-1', proficiencyLevel: 'beginner', productivity: 50, completedCount: 10 },
      { workerId: 'worker-2', proficiencyLevel: 'intermediate', productivity: 65, completedCount: 15 },
      { workerId: 'worker-3', proficiencyLevel: 'advanced', productivity: 80, completedCount: 20 },
      { workerId: 'worker-4', proficiencyLevel: 'expert', productivity: 95, completedCount: 25 },
    ];

    // ステップ2: AIクライアントのスタブを構成
    // 複数の習熟度レベルを適用した実現可能性スコア計算を実施するよう設定
    const aiClientStub = {
      generateAllocationPlans: jest.fn(async (params: any) => {
        // 複数習熟度レベルに基づいた実現可能性スコア計算をシミュレート
        // 各習熟度レベルのスコア: beginner=0.2, intermediate=0.4, advanced=0.6, expert=0.8
        const applicableScores = proficiencyLevels.map((level, index) => 0.2 + index * 0.2);
        const multiLevelScore = applicableScores.reduce((a, b) => a + b, 0) / applicableScores.length;

        return {
          plans: [
            {
              allocationPlanId: 'plan-1',
              planName: 'Allocation Plan 1',
              feasibilityScore: multiLevelScore,
              recommendedRank: 1,
              status: 'generated',
            },
            {
              allocationPlanId: 'plan-2',
              planName: 'Allocation Plan 2',
              feasibilityScore: multiLevelScore * 0.95,
              recommendedRank: 2,
              status: 'generated',
            },
          ],
          proficiencyLevelsUsed: proficiencyLevels,
          productivityDataCount: productivityData.length * 30,
          workersAnalyzed: productivityData.length,
          executionTimeMs: 1250,
        };
      }),
    };

    // ステップ3: runTx2Imp2Agent を呼び出す
    const input: Tx2Imp2AgentInput = {
      facilityId,
      teamId: null,
      workInstructionId: null,
      analysisStartDate: startDate,
      analysisEndDate: endDate,
      executingUserId,
      autoApprovalEnabled: true,
    };

    const output: Tx2Imp2AgentOutput = await runTx2Imp2Agent(input, aiClientStub as any);

    // ステップ4: 処理が正常に完了したことを確認
    expect(output.status).toMatch(/^(success|partial_success)$/);

    // ステップ5: analysisMetadata.proficiencyLevelsApplied を検査
    expect(output.analysisMetadata).toBeDefined();
    expect(output.analysisMetadata.proficiencyLevelsApplied).toBeDefined();
    expect(Array.isArray(output.analysisMetadata.proficiencyLevelsApplied)).toBe(true);

    // 全4つの習熟度レベルが含まれていることを確認
    const expectedLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    expectedLevels.forEach((level) => {
      expect(output.analysisMetadata.proficiencyLevelsApplied).toContain(level);
    });

    // ステップ6: proficiencyLevelsApplied 配列の長さが4以上であることを確認
    expect(output.analysisMetadata.proficiencyLevelsApplied.length).toBeGreaterThanOrEqual(4);

    // 配列内に重複がないことを確認
    const uniqueLevels = new Set(output.analysisMetadata.proficiencyLevelsApplied);
    expect(uniqueLevels.size).toBe(output.analysisMetadata.proficiencyLevelsApplied.length);

    // ステップ7: generatedAllocationPlans の feasibilityScore を検証
    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBeGreaterThan(0);

    // 複数習熟度レベルに基づく計算であることを検証
    // 期待値: (0.2 + 0.4 + 0.6 + 0.8) / 4 = 0.5
    const expectedMultiLevelScore = 0.5;

    output.generatedAllocationPlans.forEach((plan, index) => {
      // feasibilityScore が 0～1 の範囲内の数値であることを確認
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(1);

      // feasibilityScore が複数習熟度レベルに基づいて計算されたことを検証
      if (index === 0) {
        // 最初の計画は複数レベルの加重平均スコア
        expect(plan.feasibilityScore).toBeCloseTo(expectedMultiLevelScore, 1);
      } else if (index === 1) {
        // 2番目の計画はスコアが異なる（95%）
        expect(plan.feasibilityScore).toBeCloseTo(expectedMultiLevelScore * 0.95, 1);
      }

      // 複数習熟度レベルの計算であることを確認
      // 単一レベルのみの場合、スコアは 0.2, 0.4, 0.6, 0.8 のいずれかになるが、
      // 複数レベルでは 0.5 付近の値になる
      expect([0.2, 0.4, 0.6, 0.8]).not.toContain(Math.round(plan.feasibilityScore * 10) / 10);

      expect(plan.feasibilityScore).toBeDefined();
    });

    // 分析メタデータの妥当性を確認
    expect(output.analysisMetadata.productivityDataCount).toBeGreaterThan(0);
    expect(output.analysisMetadata.workersAnalyzed).toBeGreaterThan(0);
    expect(output.analysisMetadata.analysisExecutionTimeMs).toBeGreaterThan(0);

    // メタデータが実際のテストデータを反映していることを確認
    expect(output.analysisMetadata.workersAnalyzed).toBe(productivityData.length);
  });
});