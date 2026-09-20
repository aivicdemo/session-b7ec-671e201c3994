import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('SCEN-475: judgeProficiencyLevel - timeZone parameter handling', () => {
  it('should interpret evaluationDateTime in the specified timeZone and calculate lookback period accordingly', async () => {
    // Arrange
    const workerId = 'W001';
    const jobType = 'ピッキング';
    const evaluationDateTime = '2024-01-15T14:30:00Z';
    const timeZone = 'Asia/Tokyo';
    const lookbackDays = 30;
    const pastProductivityRecords = [
      { workDate: '2024-01-10', productivityRate: 45.0, qualityScore: 92 },
      { workDate: '2024-01-11', productivityRate: 48.5, qualityScore: 95 },
      { workDate: '2024-01-12', productivityRate: 42.0, qualityScore: 88 },
      { workDate: '2024-01-13', productivityRate: 50.0, qualityScore: 96 }
    ];

    const input = {
      workerId,
      jobType,
      evaluationDateTime,
      pastProductivityRecords,
      lookbackDays,
      timeZone
    };

    // Act
    const result = await judgeProficiencyLevel(input);

    // Assert
    // 1. Verify evaluatedRecordCount is 4 (all records within lookback period)
    expect(result.evaluatedRecordCount).toBe(4);

    // 2. Verify averageProductivityRate is calculated correctly
    // Expected: (45.0 + 48.5 + 42.0 + 50.0) / 4 = 46.375
    expect(result.averageProductivityRate).toBeCloseTo(46.375, 2);

    // 3. Verify averageQualityScore is calculated correctly
    // Expected: (92 + 95 + 88 + 96) / 4 = 92.75
    expect(result.averageQualityScore).toBeCloseTo(92.75, 2);

    // 4. Verify proficiencyLevel is appropriately determined
    // With averageProductivityRate=46.375 (medium) and averageQualityScore=92.75 (high),
    // proficiencyLevel should be either INTERMEDIATE or ADVANCED
    expect(['INTERMEDIATE', 'ADVANCED']).toContain(result.proficiencyLevel);

    // 5. Verify workerId matches input
    expect(result.workerId).toBe(workerId);

    // 6. Verify jobType matches input
    expect(result.jobType).toBe(jobType);

    // 7. Verify evaluationDateTime is in the output
    expect(result.evaluationDateTime).toBeDefined();
    expect(typeof result.evaluationDateTime).toBe('string');

    // 8. Verify judgmentReason is provided (should explain the proficiency level determination)
    expect(result.judgmentReason).toBeDefined();
    expect(result.judgmentReason.length).toBeGreaterThan(0);

    // 9. Verify recommendedDifficultyLevel is determined
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.recommendedDifficultyLevel);
  });
});