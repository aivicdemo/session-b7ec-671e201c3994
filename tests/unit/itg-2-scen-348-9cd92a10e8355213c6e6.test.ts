import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';

describe('SCEN-348: 標準生産性との比較結果が出力に含まれる', () => {
  it('should include comparisonWithStandardPerformance in output with correct values', async () => {
    const workerId = 'EMP001';
    const initialAssignmentId = 'INIT001';
    const analysisStartDateTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = new Date();
    const requestingUserId = 'LEADER001';

    const result = await analyzeInitialAssignmentPerformance({
      workerId,
      initialAssignmentId,
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId,
    });

    // comparisonWithStandardPerformanceフィールドが存在することを確認
    expect(result).toHaveProperty('comparisonWithStandardPerformance');
    expect(result.comparisonWithStandardPerformance).toBeDefined();

    const comparison = result.comparisonWithStandardPerformance;

    // 標準生産性と実績生産性が含まれることを確認
    expect(comparison).toHaveProperty('standardProductivityRate');
    expect(comparison).toHaveProperty('actualProductivityRate');
    expect(comparison).toHaveProperty('deviationPercentage');
    expect(comparison.standardProductivityRate).toBe(85);
    expect(typeof comparison.actualProductivityRate).toBe('number');
    expect(typeof comparison.deviationPercentage).toBe('number');

    // 標準品質スコアと実績品質スコアが含まれることを確認
    expect(comparison).toHaveProperty('standardQualityScore');
    expect(comparison).toHaveProperty('actualQualityScore');
    expect(comparison).toHaveProperty('qualityDeviation');
    expect(comparison.standardQualityScore).toBe(92);
    expect(typeof comparison.actualQualityScore).toBe('number');
    expect(typeof comparison.qualityDeviation).toBe('number');

    // aggregatedPerformanceDataとの整合性を確認
    expect(result).toHaveProperty('aggregatedPerformanceData');
    const aggregated = result.aggregatedPerformanceData;
    expect(aggregated.averageProductivityRate).toBe(comparison.actualProductivityRate);
    expect(aggregated.averageQualityScore).toBe(comparison.actualQualityScore);

    // proficiencyStageの判定根拠に比較結果が反映されていることを確認
    expect(result).toHaveProperty('proficiencyStage');
    const proficiency = result.proficiencyStage;
    expect(proficiency).toHaveProperty('evaluationReason');
    expect(typeof proficiency.evaluationReason).toBe('string');
    expect(proficiency.evaluationReason.length).toBeGreaterThan(0);
  });
});