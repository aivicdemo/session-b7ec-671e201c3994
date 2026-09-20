import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import { JudgeProficiencyLevelInput, JudgeProficiencyLevelOutput } from '../../src/logic/validation-common-calculation';

describe('SCEN-483: judgeProficiencyLevel - evaluatedRecordCount accuracy', () => {
  it('should return evaluatedRecordCount matching the number of pastProductivityRecords', async () => {
    // Setup: Prepare 3 past productivity records
    const pastProductivityRecords = [
      { workDate: '2024-01-01', productivityRate: 50, qualityScore: 85 },
      { workDate: '2024-01-02', productivityRate: 55, qualityScore: 88 },
      { workDate: '2024-01-03', productivityRate: 52, qualityScore: 86 }
    ];

    const input: JudgeProficiencyLevelInput = {
      workerId: 'WORKER-001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-03T09:00:00Z',
      pastProductivityRecords: pastProductivityRecords,
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo'
    };

    // Execute: Call judgeProficiencyLevel
    const output: JudgeProficiencyLevelOutput = await judgeProficiencyLevel(input);

    // Verify: Check that evaluatedRecordCount matches the input records count
    expect(output.evaluatedRecordCount).toBe(3);
    expect(output.evaluatedRecordCount).toBe(pastProductivityRecords.length);

    // Verify: All required output fields are present and properly structured
    expect(output.workerId).toBe('WORKER-001');
    expect(output.jobType).toBe('ピッキング');
    expect(output.evaluationDateTime).toBe('2024-01-03T09:00:00Z');
    expect(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).toContain(output.proficiencyLevel);
    expect(typeof output.averageProductivityRate).toBe('number');
    expect(output.averageProductivityRate).toBeGreaterThanOrEqual(0);
    expect(typeof output.averageQualityScore).toBe('number');
    expect(output.averageQualityScore).toBeGreaterThanOrEqual(0);
    expect(output.averageQualityScore).toBeLessThanOrEqual(100);
    expect(typeof output.judgmentReason).toBe('string');
    expect(output.judgmentReason.length).toBeGreaterThan(0);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(output.recommendedDifficultyLevel);
  });
});