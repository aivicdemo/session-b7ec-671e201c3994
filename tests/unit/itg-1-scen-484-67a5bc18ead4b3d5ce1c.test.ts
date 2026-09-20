import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import { JudgeProficiencyLevelInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-484: 習熟度判定の根拠が生産性率と品質スコアの具体的な値と組み合わせ理由をjudgmentReasonに記載して返される', () => {
  it('should return proficiency level with specific productivity rate and quality score values in judgmentReason', async () => {
    // 入力値を準備する
    const input: JudgeProficiencyLevelInput = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        {
          workDate: '2024-01-13',
          productivityRate: 45.5,
          qualityScore: 92,
        },
        {
          workDate: '2024-01-14',
          productivityRate: 48.2,
          qualityScore: 88,
        },
        {
          workDate: '2024-01-15',
          productivityRate: 46.8,
          qualityScore: 95,
        },
      ],
      lookbackDays: 90,
      timeZone: 'UTC',
    };

    // judgeProficiencyLevel に入力値を渡して呼び出す
    const result = await judgeProficiencyLevel(input);

    // 戻り値の proficiencyLevel フィールドを確認する
    expect(result.proficiencyLevel).toMatch(/^(BEGINNER|INTERMEDIATE|ADVANCED)$/);

    // 戻り値の averageProductivityRate フィールドを確認する
    // (45.5+48.2+46.8)/3 = 46.833...
    expect(result.averageProductivityRate).toBeCloseTo(46.83, 1);

    // 戻り値の averageQualityScore フィールドを確認する
    // (92+88+95)/3 = 91.666...
    expect(result.averageQualityScore).toBeCloseTo(91.67, 1);

    // 戻り値の evaluatedRecordCount フィールドを確認する
    expect(result.evaluatedRecordCount).toBe(3);

    // 戻り値の judgmentReason フィールドを確認する
    // 生産性率と品質スコアの具体的な値を含んでいることを検証
    expect(result.judgmentReason).toBeDefined();
    expect(result.judgmentReason).toMatch(/46\.8/);
    expect(result.judgmentReason).toMatch(/91\.6/);
    expect(result.judgmentReason).toContain('生産性率');
    expect(result.judgmentReason).toContain('品質スコア');

    // 他のフィールドを確認する
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.recommendedDifficultyLevel).toMatch(/^(LOW|MEDIUM|HIGH)$/);
  });
});