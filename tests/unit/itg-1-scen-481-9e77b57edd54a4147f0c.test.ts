import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('SCEN-481: 習熟度レベル判定 - INTERMEDIATE判定と推奨難度レベル', () => {
  it('should return INTERMEDIATE proficiency level with MEDIUM recommended difficulty when productivity and quality scores indicate intermediate skill', async () => {
    // Arrange
    const workerId = 'W001';
    const jobType = 'ピッキング';
    const evaluationDateTime = '2024-01-15T10:00:00Z';
    const pastProductivityRecords = [
      { workDate: '2024-01-10', productivityRate: 45.0, qualityScore: 85 },
      { workDate: '2024-01-11', productivityRate: 48.5, qualityScore: 87 },
      { workDate: '2024-01-12', productivityRate: 46.0, qualityScore: 84 },
      { workDate: '2024-01-13', productivityRate: 50.0, qualityScore: 88 },
      { workDate: '2024-01-14', productivityRate: 47.5, qualityScore: 86 },
    ];
    const lookbackDays = 90;
    const timeZone = 'Asia/Tokyo';

    const input = {
      workerId,
      jobType,
      evaluationDateTime,
      pastProductivityRecords,
      lookbackDays,
      timeZone,
    };

    // Act
    const result = await judgeProficiencyLevel(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.proficiencyLevel).toBe('INTERMEDIATE');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.averageProductivityRate).toBeCloseTo(47.4, 1);
    expect(result.averageQualityScore).toBeCloseTo(86.0, 1);
    expect(result.evaluatedRecordCount).toBe(5);
    expect(result.judgmentReason).toContain('中級');
    expect(result.recommendedDifficultyLevel).toBe('MEDIUM');
  });
});