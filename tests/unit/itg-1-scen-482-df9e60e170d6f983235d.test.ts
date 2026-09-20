import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import { JudgeProficiencyLevelInput, JudgeProficiencyLevelOutput } from '../../src/logic/validation-common-calculation';

describe('SCEN-482: 習熟度レベルADVANCEDに対応する推奨作業難度レベルがHIGHで返される', () => {
  it('should return proficiency level ADVANCED with recommended difficulty level HIGH when productivity and quality scores are high', () => {
    // Arrange
    const input: JudgeProficiencyLevelInput = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        {
          workDate: '2024-01-14',
          productivityRate: 92,
          qualityScore: 96,
        },
        {
          workDate: '2024-01-13',
          productivityRate: 91,
          qualityScore: 95,
        },
        {
          workDate: '2024-01-12',
          productivityRate: 90,
          qualityScore: 97,
        },
      ],
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo',
    };

    // Act
    const result: JudgeProficiencyLevelOutput = judgeProficiencyLevel(input);

    // Assert
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.proficiencyLevel).toBe('ADVANCED');
    expect(result.recommendedDifficultyLevel).toBe('HIGH');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.averageProductivityRate).toBeGreaterThanOrEqual(90);
    expect(result.averageQualityScore).toBeGreaterThanOrEqual(95);
    expect(result.evaluatedRecordCount).toBeGreaterThanOrEqual(3);
    expect(result.judgmentReason).toBeTruthy();
    expect(typeof result.judgmentReason).toBe('string');
    expect(result.judgmentReason.length).toBeGreaterThan(0);
  });
});