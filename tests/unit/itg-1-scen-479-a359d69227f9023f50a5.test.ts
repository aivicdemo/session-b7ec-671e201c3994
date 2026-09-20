import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import { JudgeProficiencyLevelInput, JudgeProficiencyLevelOutput } from '../../src/logic/validation-common-calculation';

describe('SCEN-479: 平均生産性率と平均品質スコアの組み合わせに基づいて習熟度レベルがADVANCEDと判定される', () => {
  it('should judge proficiency level as ADVANCED when both average productivity and quality score are high', async () => {
    // Arrange
    const input: JudgeProficiencyLevelInput = {
      workerId: 'WK001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        { workDate: '2024-01-10', productivityRate: 95.0, qualityScore: 95 },
        { workDate: '2024-01-11', productivityRate: 98.0, qualityScore: 96 },
        { workDate: '2024-01-12', productivityRate: 92.0, qualityScore: 94 },
        { workDate: '2024-01-13', productivityRate: 97.0, qualityScore: 97 },
        { workDate: '2024-01-14', productivityRate: 94.0, qualityScore: 95 },
      ],
      lookbackDays: 90,
      timeZone: 'UTC',
    };

    // Act
    const result = await judgeProficiencyLevel(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.workerId).toBe('WK001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.proficiencyLevel).toBe('ADVANCED');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.averageProductivityRate).toBeCloseTo(95.2, 1);
    expect(result.averageQualityScore).toBeCloseTo(95.4, 1);
    expect(result.evaluatedRecordCount).toBe(5);
    expect(result.judgmentReason).toBeDefined();
    expect(result.judgmentReason).toContain('ADVANCED');
    expect(result.judgmentReason).toContain('95.2');
    expect(result.judgmentReason).toContain('95.4');
    expect(result.recommendedDifficultyLevel).toBe('HIGH');
  });
});