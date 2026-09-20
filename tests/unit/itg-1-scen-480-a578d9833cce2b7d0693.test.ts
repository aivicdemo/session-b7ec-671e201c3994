import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('SCEN-480: 習熟度レベルBEGINNERに対応する推奨作業難度レベルがLOWで返される', () => {
  it('should return proficiencyLevel BEGINNER and recommendedDifficultyLevel LOW for low productivity data', async () => {
    const input = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        { workDate: '2024-01-08', productivityRate: 8.5, qualityScore: 75 },
        { workDate: '2024-01-09', productivityRate: 7.2, qualityScore: 72 },
        { workDate: '2024-01-10', productivityRate: 6.8, qualityScore: 70 },
      ],
      lookbackDays: 90,
      timeZone: 'UTC',
    };

    const result = await judgeProficiencyLevel(input);

    expect(result.proficiencyLevel).toBe('BEGINNER');
    expect(result.recommendedDifficultyLevel).toBe('LOW');
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.averageProductivityRate).toBeCloseTo(7.5, 1);
    expect(result.averageQualityScore).toBeCloseTo(72.33, 1);
    expect(result.evaluatedRecordCount).toBe(3);
    expect(result.judgmentReason).toMatch(/平均生産性率7.5件\/時間.*平均品質スコア72.33.*初級者/);
  });
});