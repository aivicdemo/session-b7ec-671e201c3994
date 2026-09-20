import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('SCEN-478: 習熟度レベル判定 - INTERMEDIATE判定ケース', () => {
  it('平均生産性率と平均品質スコアの組み合わせに基づいてINTERMEDIATEと判定される', () => {
    // Arrange
    const input = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        {
          workDate: '2024-01-01',
          productivityRate: 45.0,
          qualityScore: 85.0,
        },
        {
          workDate: '2024-01-08',
          productivityRate: 48.0,
          qualityScore: 82.0,
        },
        {
          workDate: '2024-01-15',
          productivityRate: 46.0,
          qualityScore: 88.0,
        },
      ],
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo',
    };

    // Act
    const result = judgeProficiencyLevel(input);

    // Assert
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.proficiencyLevel).toBe('INTERMEDIATE');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.averageProductivityRate).toBeCloseTo(46.33, 2);
    expect(result.averageQualityScore).toBeCloseTo(85.0, 1);
    expect(result.evaluatedRecordCount).toBe(3);
    expect(result.judgmentReason).toContain('中級');
    expect(result.recommendedDifficultyLevel).toBe('MEDIUM');
  });
});