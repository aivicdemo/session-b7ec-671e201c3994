import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import { JudgeProficiencyLevelInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-477: 習熟度レベル判定 - BEGINNER判定', () => {
  it('平均生産性率と平均品質スコアの組み合わせに基づいてBEGINNERと判定される', async () => {
    // テスト入力データの準備
    const input: JudgeProficiencyLevelInput = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        {
          workDate: '2024-01-10',
          productivityRate: 45,
          qualityScore: 75,
        },
        {
          workDate: '2024-01-11',
          productivityRate: 48,
          qualityScore: 78,
        },
        {
          workDate: '2024-01-12',
          productivityRate: 42,
          qualityScore: 72,
        },
      ],
      lookbackDays: 90,
      timeZone: 'UTC',
    };

    // 関数を実行
    const result = await judgeProficiencyLevel(input);

    // 習熟度レベルがBEGINNERであることを確認
    expect(result.proficiencyLevel).toBe('BEGINNER');

    // 平均生産性率を検証: (45+48+42)/3 = 45
    expect(result.averageProductivityRate).toBe(45);

    // 平均品質スコアを検証: (75+78+72)/3 = 75
    expect(result.averageQualityScore).toBe(75);

    // 評価に使用した過去実績レコード数
    expect(result.evaluatedRecordCount).toBe(3);

    // 推奨される作業難度レベル
    expect(result.recommendedDifficultyLevel).toBe('LOW');

    // 判定根拠に平均生産性率と平均品質スコアの組み合わせが記載されていることを確認
    expect(result.judgmentReason).toContain('45');
    expect(result.judgmentReason).toContain('75');
    expect(result.judgmentReason).toMatch(
      /(?:平均生産性率|生産性|45)/i
    );
    expect(result.judgmentReason).toMatch(
      /(?:平均品質スコア|品質|75)/i
    );
    expect(result.judgmentReason).toMatch(
      /(?:初級|BEGINNER|判定)/i
    );

    // 入力値との一致確認
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('ピッキング');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:00:00Z');
  });
});