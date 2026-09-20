import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('SCEN-474: judgeProficiencyLevel with default lookbackDays', () => {
  it('should evaluate past productivity records within default 90-day period when lookbackDays is not specified', () => {
    // 評価日時を2024-01-15に設定
    const evaluationDateTime = '2024-01-15T10:00:00Z';
    
    // 評価日時から遡った90日以内のデータ（2023-10-17～2024-01-15）を準備
    const pastProductivityRecords = [
      {
        workDate: '2023-10-20',
        productivityRate: 10.0,
        qualityScore: 85
      },
      {
        workDate: '2023-11-05',
        productivityRate: 12.0,
        qualityScore: 88
      },
      {
        workDate: '2023-12-01',
        productivityRate: 14.0,
        qualityScore: 90
      },
      {
        workDate: '2024-01-10',
        productivityRate: 15.0,
        qualityScore: 92
      },
      {
        workDate: '2024-01-15',
        productivityRate: 16.0,
        qualityScore: 94
      },
      // 90日以前のデータ（評価対象外となるはず）
      {
        workDate: '2023-10-16',
        productivityRate: 8.0,
        qualityScore: 75
      }
    ];

    const input = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime,
      pastProductivityRecords,
      // lookbackDays は指定しない（デフォルト90日が適用されるべき）
      // timeZone も指定しない
    };

    const result = judgeProficiencyLevel(input);

    // 返却された evaluatedRecordCount を確認
    // 90日以内のレコードは5件のはず（2023-10-20以降のデータ）
    expect(result.evaluatedRecordCount).toBe(5);

    // averageProductivityRate の計算を検証
    // (10.0 + 12.0 + 14.0 + 15.0 + 16.0) / 5 = 13.4
    const expectedAvgProductivity = (10.0 + 12.0 + 14.0 + 15.0 + 16.0) / 5;
    expect(result.averageProductivityRate).toBeCloseTo(expectedAvgProductivity, 1);

    // averageQualityScore の計算を検証
    // (85 + 88 + 90 + 92 + 94) / 5 = 89.8
    const expectedAvgQuality = (85 + 88 + 90 + 92 + 94) / 5;
    expect(result.averageQualityScore).toBeCloseTo(expectedAvgQuality, 1);

    // 習熟度レベルが判定されていることを確認
    expect(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).toContain(result.proficiencyLevel);

    // 判定理由が出力されていることを確認
    expect(result.judgmentReason).toBeTruthy();
    expect(typeof result.judgmentReason).toBe('string');

    // 推奨難度レベルが出力されていることを確認
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.recommendedDifficultyLevel);

    // 評価対象外となるはずの古いデータ（2023-10-16）が評価に含まれていないことを確認
    // averageProductivityRate が8.0を含まない値であることで確認
    expect(result.averageProductivityRate).toBeGreaterThan(8.0);
  });
});