import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import { JudgeProficiencyLevelInput, JudgeProficiencyLevelOutput } from '../../src/logic/validation-common-calculation';

describe('SCEN-473: lookbackDaysが指定された場合、その日数分遡った過去実績データのみが評価対象となる', () => {
  it('evaluatedRecordCountはフィルタ後の件数で返される', () => {
    // Arrange
    const evaluationDateTime = '2024-01-15T10:00:00Z';
    const lookbackDays = 30;
    
    const pastProductivityRecords = [
      { workDate: '2024-01-10', productivityRate: 45.0, qualityScore: 92 },
      { workDate: '2024-01-09', productivityRate: 48.5, qualityScore: 94 },
      { workDate: '2024-01-08', productivityRate: 46.2, qualityScore: 91 },
      { workDate: '2024-01-07', productivityRate: 47.8, qualityScore: 93 },
      { workDate: '2024-01-06', productivityRate: 44.1, qualityScore: 90 },
      { workDate: '2023-12-20', productivityRate: 50.0, qualityScore: 95 },
      { workDate: '2023-12-10', productivityRate: 42.0, qualityScore: 88 },
      { workDate: '2023-12-01', productivityRate: 40.5, qualityScore: 85 },
    ];

    const input: JudgeProficiencyLevelInput = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime,
      pastProductivityRecords,
      lookbackDays,
      timeZone: 'Asia/Tokyo',
    };

    // Act
    const result: JudgeProficiencyLevelOutput = judgeProficiencyLevel(input);

    // Assert
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.evaluatedRecordCount).toBe(5);
    
    const expectedAverageProductivity = (45.0 + 48.5 + 46.2 + 47.8 + 44.1) / 5;
    expect(result.averageProductivityRate).toBeCloseTo(expectedAverageProductivity, 2);
    
    const expectedAverageQuality = (92 + 94 + 91 + 93 + 90) / 5;
    expect(result.averageQualityScore).toBeCloseTo(expectedAverageQuality, 2);
    
    expect(result.proficiencyLevel).toMatch(/BEGINNER|INTERMEDIATE|ADVANCED/);
    expect(result.evaluationDateTime).toBe(evaluationDateTime);
    expect(result.judgmentReason).toBeTruthy();
    expect(result.recommendedDifficultyLevel).toMatch(/LOW|MEDIUM|HIGH/);
  });
});