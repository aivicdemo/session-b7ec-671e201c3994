import {
  listDelayRiskJudgmentByCondition,
  SaveDelayRiskJudgmentInput,
  saveDelayRiskJudgment,
} from '../../src/logic/data-persistence';

describe('SCEN-1000: 更新日時の範囲で検索結果を絞り込む', () => {
  it('should filter delay risk judgment results by updatedFromDate and updatedToDate range', async () => {
    // 前提準備：複数件のリスク判定結果データを作成
    // 仕様に記載されたJST日時をUTCに変換して使用
    const testDataDefinitions = [
      {
        id: 'wi-a-001',
        facilityId: 'fac-a-001',
        teamId: 'team-a-001',
        judgmentDateTime: '2024-01-05T10:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 3,
        progressRate: 40,
        plannedProgressRate: 60,
        updatedAt: '2024-01-05T10:00:00Z',
      },
      {
        id: 'wi-b-002',
        facilityId: 'fac-b-002',
        teamId: 'team-b-002',
        judgmentDateTime: '2024-01-10T15:30:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 2,
        progressRate: 50,
        plannedProgressRate: 70,
        updatedAt: '2024-01-10T15:30:00Z',
      },
      {
        id: 'wi-c-003',
        facilityId: 'fac-c-003',
        teamId: 'team-c-003',
        judgmentDateTime: '2024-01-15T09:45:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 1,
        progressRate: 60,
        plannedProgressRate: 80,
        updatedAt: '2024-01-15T09:45:00Z',
      },
      {
        id: 'wi-d-004',
        facilityId: 'fac-d-004',
        teamId: 'team-d-004',
        judgmentDateTime: '2024-01-20T14:20:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 2,
        progressRate: 55,
        plannedProgressRate: 75,
        updatedAt: '2024-01-20T14:20:00Z',
      },
    ];

    // テストデータを保存する
    const createdRecords = [];
    for (const data of testDataDefinitions) {
      const input: SaveDelayRiskJudgmentInput = {
        riskJudgmentId: null,
        workInstructionId: data.id,
        facilityId: data.facilityId,
        teamId: data.teamId,
        judgmentDateTime: data.judgmentDateTime,
        riskLevel: data.riskLevel,
        delayPredictionDays: data.delayPredictionDays,
        progressRate: data.progressRate,
        plannedProgressRate: data.plannedProgressRate,
        judgmentReason: `Test reason for ${data.id}`,
        recommendedAction: 'Test action',
        actionStatus: 'pending',
        createdBy: 'test-user',
      };

      const saved = await saveDelayRiskJudgment(input);
      createdRecords.push(saved);
    }

    // テスト実行：仕様で指定された固定日時の検索条件を使用
    const searchCondition = {
      updatedFromDate: '2024-01-08T00:00:00Z',
      updatedToDate: '2024-01-18T23:59:59Z',
    };

    const result = await listDelayRiskJudgmentByCondition(searchCondition);

    // 期待結果の検証
    expect(result).toBeDefined();
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

    // 戻り値に含まれるデータの更新日時が指定範囲内であることを確認
    result.delayRiskJudgments.forEach((judgment) => {
      const updatedAt = new Date(judgment.updatedAt).getTime();
      const fromTimeMs = new Date('2024-01-08T00:00:00Z').getTime();
      const toTimeMs = new Date('2024-01-18T23:59:59Z').getTime();

      expect(updatedAt).toBeGreaterThanOrEqual(fromTimeMs);
      expect(updatedAt).toBeLessThanOrEqual(toTimeMs);
    });

    // 返却されたデータの作業指示IDを確認
    const returnedWorkInstructionIds = result.delayRiskJudgments.map(
      (judgment) => judgment.workInstructionId
    );

    // データAおよびデータDは検索範囲外のため含まれていないことを確認
    expect(returnedWorkInstructionIds).not.toContain('wi-a-001');
    expect(returnedWorkInstructionIds).not.toContain('wi-d-004');

    // データBおよびデータCは検索範囲内のため含まれていることを確認
    expect(returnedWorkInstructionIds).toContain('wi-b-002');
    expect(returnedWorkInstructionIds).toContain('wi-c-003');

    // 正確に2件のデータ（データBとC）が含まれることを確認
    expect(result.totalCount).toBe(2);
    expect(result.delayRiskJudgments.length).toBe(2);

    // retrievedAtがISO 8601形式の文字列で返却されていることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});