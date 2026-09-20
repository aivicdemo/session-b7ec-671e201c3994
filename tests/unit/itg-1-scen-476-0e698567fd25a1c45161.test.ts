import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('judgeProficiencyLevel - timeZoneが指定されない場合のテスト', () => {
  it('timeZoneが未指定の場合、evaluationDateTimeはUTCを基準に解釈される', async () => {
    // テスト日時 (UTC として解釈される)
    const evaluationDateTime = '2024-01-15T10:30:00';
    const workerId = 'worker-001';
    const jobType = 'ピッキング';

    // 過去実績データ（3件以上）
    const pastProductivityRecords = [
      {
        workDate: '2024-01-14',
        productivityRate: 45,
        qualityScore: 92,
      },
      {
        workDate: '2024-01-13',
        productivityRate: 48,
        qualityScore: 90,
      },
      {
        workDate: '2024-01-12',
        productivityRate: 46,
        qualityScore: 91,
      },
    ];

    // timeZone を指定しない（未指定）
    const input = {
      workerId,
      jobType,
      evaluationDateTime,
      pastProductivityRecords,
      lookbackDays: 90,
      // timeZone は指定しない
    };

    // judgeProficiencyLevel を呼び出す
    const result = await judgeProficiencyLevel(input);

    // 戻り値の evaluationDateTime が UTC として解釈されていることを確認
    expect(result.evaluationDateTime).toBe('2024-01-15T10:30:00');

    // proficiencyLevel が判定されていることを確認
    expect(result.proficiencyLevel).toMatch(/^(BEGINNER|INTERMEDIATE|ADVANCED)$/);

    // 平均生産性率が計算されていることを確認
    expect(result.averageProductivityRate).toBeGreaterThan(0);
    expect(result.averageProductivityRate).toBeLessThanOrEqual(100);

    // 平均品質スコアが計算されていることを確認
    expect(result.averageQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.averageQualityScore).toBeLessThanOrEqual(100);

    // 評価に使用されたレコード数が正常であることを確認
    expect(result.evaluatedRecordCount).toBeGreaterThanOrEqual(3);

    // 判定理由が記述されていることを確認
    expect(result.judgmentReason).toBeTruthy();
    expect(typeof result.judgmentReason).toBe('string');
    expect(result.judgmentReason.length).toBeGreaterThan(0);

    // 推奨難度レベルが判定されていることを確認
    expect(result.recommendedDifficultyLevel).toMatch(/^(LOW|MEDIUM|HIGH)$/);

    // 入力値の確認
    expect(result.workerId).toBe(workerId);
    expect(result.jobType).toBe(jobType);
  });

  it('timeZoneが未指定の場合、複数の過去実績から平均値が正しく計算される', async () => {
    const evaluationDateTime = '2024-01-15T10:30:00';
    const workerId = 'worker-002';
    const jobType = '梱包';

    // より多くの過去実績データ
    const pastProductivityRecords = [
      {
        workDate: '2024-01-14',
        productivityRate: 50,
        qualityScore: 95,
      },
      {
        workDate: '2024-01-13',
        productivityRate: 52,
        qualityScore: 94,
      },
      {
        workDate: '2024-01-12',
        productivityRate: 51,
        qualityScore: 96,
      },
      {
        workDate: '2024-01-11',
        productivityRate: 49,
        qualityScore: 93,
      },
      {
        workDate: '2024-01-10',
        productivityRate: 53,
        qualityScore: 95,
      },
    ];

    const input = {
      workerId,
      jobType,
      evaluationDateTime,
      pastProductivityRecords,
      lookbackDays: 90,
      // timeZone は指定しない
    };

    const result = await judgeProficiencyLevel(input);

    // 期待される平均生産性率: (50 + 52 + 51 + 49 + 53) / 5 = 51
    expect(result.averageProductivityRate).toBeCloseTo(51, 1);

    // 期待される平均品質スコア: (95 + 94 + 96 + 93 + 95) / 5 = 94.6
    expect(result.averageQualityScore).toBeCloseTo(94.6, 1);

    // 評価に使用されたレコード数が 5 件であることを確認
    expect(result.evaluatedRecordCount).toBe(5);

    // proficiencyLevel が判定されていることを確認
    expect(result.proficiencyLevel).toMatch(/^(BEGINNER|INTERMEDIATE|ADVANCED)$/);
  });

  it('timeZoneが未指定でも、結果オブジェクトのすべてのフィールドが返却される', async () => {
    const evaluationDateTime = '2024-01-15T10:30:00';
    const workerId = 'worker-003';
    const jobType = '検品';

    const pastProductivityRecords = [
      {
        workDate: '2024-01-14',
        productivityRate: 40,
        qualityScore: 88,
      },
      {
        workDate: '2024-01-13',
        productivityRate: 42,
        qualityScore: 86,
      },
      {
        workDate: '2024-01-12',
        productivityRate: 41,
        qualityScore: 87,
      },
    ];

    const input = {
      workerId,
      jobType,
      evaluationDateTime,
      pastProductivityRecords,
      lookbackDays: 90,
      // timeZone は指定しない
    };

    const result = await judgeProficiencyLevel(input);

    // 必須フィールドの存在確認
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('jobType');
    expect(result).toHaveProperty('proficiencyLevel');
    expect(result).toHaveProperty('evaluationDateTime');
    expect(result).toHaveProperty('averageProductivityRate');
    expect(result).toHaveProperty('averageQualityScore');
    expect(result).toHaveProperty('evaluatedRecordCount');
    expect(result).toHaveProperty('judgmentReason');
    expect(result).toHaveProperty('recommendedDifficultyLevel');

    // 各フィールドの型と値の妥当性確認
    expect(typeof result.workerId).toBe('string');
    expect(typeof result.jobType).toBe('string');
    expect(typeof result.proficiencyLevel).toBe('string');
    expect(typeof result.evaluationDateTime).toBe('string');
    expect(typeof result.averageProductivityRate).toBe('number');
    expect(typeof result.averageQualityScore).toBe('number');
    expect(typeof result.evaluatedRecordCount).toBe('number');
    expect(typeof result.judgmentReason).toBe('string');
    expect(typeof result.recommendedDifficultyLevel).toBe('string');
  });

  it('timeZoneが未指定の場合、ISO 8601形式の入力がそのまま出力される', async () => {
    const inputEvaluationDateTime = '2024-01-15T14:45:30';
    const workerId = 'worker-004';
    const jobType = 'ピッキング';

    const pastProductivityRecords = [
      {
        workDate: '2024-01-14',
        productivityRate: 47,
        qualityScore: 91,
      },
      {
        workDate: '2024-01-13',
        productivityRate: 49,
        qualityScore: 92,
      },
      {
        workDate: '2024-01-12',
        productivityRate: 46,
        qualityScore: 90,
      },
    ];

    const input = {
      workerId,
      jobType,
      evaluationDateTime: inputEvaluationDateTime,
      pastProductivityRecords,
      lookbackDays: 90,
      // timeZone は指定しない
    };

    const result = await judgeProficiencyLevel(input);

    // 出力の evaluationDateTime が入力と一致することを確認
    expect(result.evaluationDateTime).toBe(inputEvaluationDateTime);
  });
});